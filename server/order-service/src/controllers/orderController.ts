import mongoose from 'mongoose';
import { Request, Response } from 'express';
import Order from '../models/Order.js';
import { z } from 'zod';
import axios from 'axios';
import { sendMessage } from '../kafka/orderKafkaProducer.js';
import { orderQueue } from '../worker/orderQueue.js';
import logger from '../utils/logger.js';



const orderStatusSchema = z.enum(['Pending', 'Processed' ,'Shipped', 'Delivered', 'Cancelled', 'Expired'])

const initialOrderCreationSchema = z.object({
    products: z.array(
        z.object({
            product: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
                message: "Invalid product ID"
            }),
            name: z.string().min(1, { message: "Name is required" }),
            price: z.number().positive({ message: "Price is requried" }),
            quantity: z.number().min(1, { message: "Quantity must be at least 1" })
        })
    ).nonempty({ message: "Order must contain at least one product" }),
    shippingAddress: z.object({
        addressId:  z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
            message: "Invalid product ID"
        }),
        street: z.string().min(1, { message: "Street is required" }),
        city: z.string().min(1, { message: "City is required" }),
        state: z.string().min(1, { message: "State is required" }),
        pincode: z.string().min(5, { message: "Postal Code is required" })
    }),
    phone: z.string().min(10, { message: "Phone number must be at least 10 digits" })
});



interface xRequest extends Request{
    xid?:string;
    xrole?: string;
}


export const createOrder = async (req: xRequest, res: Response) => {
    logger.info("Create order operation initiated.");
    try {
        const userId = req.xid;
        if (!userId) {
            logger.warn("Unauthorized access: User ID missing.");
            return res.status(401).json({ message: "User ID not found. Unauthorized" });
        }

        logger.debug(`Request body: ${JSON.stringify(req.body.orderData)}`);

        // Validate request data
        const validatedData = initialOrderCreationSchema.parse(req.body.orderData);
        logger.info("Order data validation successful.");

        // Create new order
        const savedOrder = await Order.create({
            user: userId,
            phone: validatedData.phone,
            products: validatedData.products,
            shippingAddress: validatedData.shippingAddress,
            totalPrice: validatedData.products.reduce((sum, product) => sum + product.price * product.quantity, 0),
            status: 'Pending',
            jobId: 'dummy',
        });
        logger.info(`Order created successfully with ID: ${savedOrder._id}`);

        // Add job to expiration queue
        const job = await orderQueue.add(
            'order-expiration-job', // Job name
            { orderId: savedOrder._id }, // Data to pass to the worker
            {
                delay: 15 * 60 * 1000, // Delay for 15 minutes (in milliseconds)
            }
        );
        logger.info(`Order expiration job created with ID: ${job.id}`);

        savedOrder.jobId = job.id as string;
        await savedOrder.save();
        logger.info(`Order updated with job ID: ${job.id}`);

        // Prepare order details for Kafka message
        const orderDetails = {
            orderId: savedOrder._id,
            userId: savedOrder.user,
            products: savedOrder.products.map((product) => ({
                productId: product.product,
                quantity: product.quantity,
            })),
            status: savedOrder.status,
            timestamp: new Date().toISOString(),
        };

        // Send Kafka message to inventory-service
        await sendMessage('order_placed', orderDetails);
        logger.info(`Order placed event sent to Kafka for order ID: ${savedOrder._id}`);

        res.status(200).json({ order: savedOrder, message: "Order created successfully", code: "SUCCESS" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            logger.error(`Validation error while creating order: ${JSON.stringify(error.errors)}`);
            return res.status(400).json({ errors: error.errors });
        }
        logger.error(`Error while creating order: ${(error as Error).message}`);
        res.status(500).json({ error: "Server error while creating order" });
    }
};

export const getUserOrders = async (req: xRequest, res: Response) => {
    logger.info("Get user orders operation initiated.");
    try {
        const userId = req.xid;
        if (!userId) {
            logger.warn("Unauthorized access: User ID missing.");
            return res.status(401).json({ message: "User ID not found. Unauthorized" });
        }

        const userOrders = await Order.find({ user: userId }).sort({ createdAt: -1 });
        if (!userOrders || userOrders.length === 0) {
            logger.info(`No orders found for user ID: ${userId}`);
            return res.status(404).json({ message: "No orders found for this user" });
        }

        logger.info(`Orders fetched successfully for user ID: ${userId}. Order count: ${userOrders.length}`);
        res.status(200).json({ orders: userOrders });
    } catch (error) {
        logger.error(`Error fetching user orders: ${(error as Error).message}`);
        res.status(500).json({ error: "Server error while fetching user orders" });
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    logger.info("Update order status operation initiated.");
    try {
        const orderId = req.params.orderId;
        const { status } = req.body;

        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            logger.warn(`Invalid order ID: ${orderId}`);
            return res.status(400).json({ error: 'Invalid order ID' });
        }

        const validStatus = orderStatusSchema.parse(status);
        logger.info(`Validated status: ${validStatus} for order ID: ${orderId}`);

        const updatedOrder = await Order.findByIdAndUpdate(orderId, { $set: { status: validStatus } }, { new: true });
        if (!updatedOrder) {
            logger.warn(`Order not found for ID: ${orderId}`);
            return res.status(404).json({ error: 'Order not found' });
        }

        logger.info(`Order status updated successfully. Order ID: ${orderId}, New Status: ${validStatus}`);

        const orderDetails = {
            orderId: updatedOrder._id,
            userId: updatedOrder.user,
            products: updatedOrder.products.map(product => ({
                productId: product.product,
                quantity: product.quantity,
            })),
            status: validStatus,
            timeStamp: new Date().toISOString(),
        };

        if (status === 'Shipped') {
            await sendMessage('order_shipped', orderDetails);
            logger.info(`Order shipped event sent to Kafka for order ID: ${orderId}`);
        }

        return res.status(200).json({ message: 'Order status updated successfully', updatedOrder });
    } catch (error) {
        if (error instanceof z.ZodError) {
            logger.error(`Validation error: ${JSON.stringify(error.errors)}`);
            return res.status(400).json({ errors: error.errors });
        }
        logger.error(`Error updating order status: ${(error as Error).message}`);
        res.status(500).json({ error: "Server error while updating order status" });
    }
};

export const getAllOrders = async (req: Request, res: Response) => {
    logger.info("Get all orders operation initiated.");
    try {
        const allOrders = await Order.find()
            .populate('user', 'name email')
            .populate('products.product', 'name price')
            .sort({ createdAt: -1 });

        if (!allOrders || allOrders.length === 0) {
            logger.info("No orders found in the database.");
            return res.status(404).json({ message: "No orders found" });
        }

        logger.info(`All orders fetched successfully. Total orders: ${allOrders.length}`);
        res.status(200).json({ orders: allOrders });
    } catch (error) {
        logger.error(`Error fetching all orders: ${(error as Error).message}`);
        res.status(500).json({ error: "Server error while fetching all orders" });
    }
};

export const cancelOrder = async (req: xRequest, res: Response) => {
    logger.info("Cancel order operation initiated.");
    try {
        const orderId = req.params.orderId;
        const userId = req.xid;

        if (!userId) {
            logger.warn("Unauthorized access: User ID missing.");
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            logger.warn(`Invalid order ID: ${orderId}`);
            return res.status(400).json({ error: 'Invalid order ID' });
        }

        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order || order.status !== 'Processed') {
            logger.warn(`Order cannot be cancelled. Order ID: ${orderId}, Status: ${order?.status || "N/A"}`);
            return res.status(400).json({ error: 'Order cannot be cancelled' });
        }

        order.status = 'Cancelled';
        await order.save();
        logger.info(`Order cancelled successfully. Order ID: ${orderId}`);

        const orderDetails = {
            orderId: order._id,
            userId: order.user,
            products: order.products.map(product => ({
                productId: product.product,
                quantity: product.quantity,
            })),
            status: 'Cancelled',
            timestamp: new Date().toISOString(),
        };

        await sendMessage('order_canceled', orderDetails);
        logger.info(`Order canceled event sent to Kafka for order ID: ${orderId}`);

        res.status(200).json({ message: "Order cancelled successfully", order });
    } catch (error) {
        logger.error(`Error cancelling order: ${(error as Error).message}`);
        res.status(500).json({ error: "Server error while cancelling order" });
    }
};

export const autoCancelOrder = async (req: Request, res: Response) => {
    logger.info("Auto cancel order operation initiated.");
    try {
        const orderId = req.params.orderId;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            logger.warn(`Invalid order ID: ${orderId}`);
            return res.status(400).json({ error: 'Invalid order ID' });
        }

        const order = await Order.findOne({ _id: orderId });
        if (!order || order.status !== 'Pending') {
            logger.warn(`Order cannot be auto-cancelled. Order ID: ${orderId}, Status: ${order?.status || "N/A"}`);
            return res.status(400).json({ error: 'Order cannot be cancelled' });
        }

        order.status = 'Expired';
        await order.save();
        logger.info(`Order auto-cancelled successfully. Order ID: ${orderId}`);

        const orderDetails = {
            orderId: order._id,
            userId: order.user,
            products: order.products.map(product => ({
                productId: product.product,
                quantity: product.quantity,
            })),
            status: 'Expired',
            timestamp: new Date().toISOString(),
        };

        await sendMessage('order_canceled', orderDetails);
        logger.info(`Order auto-cancelled event sent to Kafka for order ID: ${orderId}`);

        res.status(200).json({ message: "Order auto-cancelled successfully", order });
    } catch (error) {
        logger.error(`Error auto-cancelling order: ${(error as Error).message}`);
        res.status(500).json({ error: "Server error while auto-cancelling order" });
    }
};

const derivePaymentStatus = (orderStatus: string): string => {
    logger.info(`Deriving payment status for order status: ${orderStatus}`);
    switch (orderStatus) {
        case "Cancelled":
        case "Expired":
            return "Failed";
        case "Processed":
        case "Shipped":
        case "Delivered":
            return "Completed";
        case "Pending":
            return "Pending";
        default:
            logger.warn(`Unknown order status: ${orderStatus}`);
            return "UNKNOWN";
    }
};

export const getOrderDetailsById = async (req: xRequest, res: Response) => {
    logger.info("Get order details operation initiated.");
    try {
        const orderId = req.params.orderId;
        const userId = req.xid;

        if (!userId) {
            logger.warn("Unauthorized access: User ID missing.");
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            logger.warn(`Invalid order ID: ${orderId}`);
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const order = await Order.findOne({ _id: orderId, user: userId }).lean();
        if (!order) {
            logger.warn(`Order not found for ID: ${orderId}`);
            return res.status(404).json({ message: 'Order not found!' });
        }

        const paymentStatus = derivePaymentStatus(order.status);
        logger.info(`Order details fetched successfully. Order ID: ${orderId}, Payment Status: ${paymentStatus}`);

        return res.status(200).json({
            message: "Order details fetched successfully",
            order: { ...order, paymentStatus },
            code: "SUCCESS",
        });
    } catch (error) {
        logger.error(`Error fetching order details: ${(error as Error).message}`);
        res.status(500).json({ error: "Server error while getting order details" });
    }
};
