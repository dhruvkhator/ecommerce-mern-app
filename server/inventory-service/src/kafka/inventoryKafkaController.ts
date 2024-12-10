import Inventory from "../models/Inventory.js";
import logger from "../utils/logger.js";

type OrderDetails = {
    orderId: string;
    userId: string;
    products: { productId: string; quantity: number }[];
    status: string;
    timestamp: string;
  };

  export const handleOrderPlaced = async (orderDetails: OrderDetails | null) => {
    if (!orderDetails) {
        logger.warn("Received null order details for order placed event");
        return;
    }
    try {
        logger.info(`Processing order placed event. Order ID: ${orderDetails.orderId}`);
        for (const item of orderDetails.products) {
            const inventoryItem = await Inventory.findOne({ productId: item.productId });
            if (inventoryItem) {
                inventoryItem.stock -= item.quantity;
                await inventoryItem.save();
                logger.info(`Reserved stock for product ID: ${item.productId}. Remaining stock: ${inventoryItem.stock}`);
            } else {
                logger.warn(`Product ID: ${item.productId} not found in inventory`);
            }
        }
        logger.info(`Order placed event processed successfully. Order ID: ${orderDetails.orderId}`);
    } catch (error) {
        logger.error(`Error handling order placed event: ${(error as Error).message}`);
    }
};

export const handleOrderShipped = async (orderDetails: OrderDetails | null) => {
    if (!orderDetails) {
        logger.warn("Received null order details for order shipped event");
        return;
    }
    try {
        logger.info(`Processing order shipped event. Order ID: ${orderDetails.orderId}`);
        for (const item of orderDetails.products) {
            const inventoryItem = await Inventory.findOne({ productId: item.productId });
            if (inventoryItem) {
                logger.info(`Stock finalized for product ID: ${item.productId}. Stock: ${inventoryItem.stock}`);
                // No action required if stock was already reduced during reservation
            } else {
                logger.warn(`Product ID: ${item.productId} not found in inventory`);
            }
        }
        logger.info(`Order shipped event processed successfully. Order ID: ${orderDetails.orderId}`);
    } catch (error) {
        logger.error(`Error handling order shipped event: ${(error as Error).message}`);
    }
};

export const handleOrderCanceled = async (orderDetails: OrderDetails | null) => {
    if (!orderDetails) {
        logger.warn("Received null order details for order canceled event");
        return;
    }
    try {
        logger.info(`Processing order canceled event. Order ID: ${orderDetails.orderId}`);
        for (const item of orderDetails.products) {
            const inventoryItem = await Inventory.findOne({ productId: item.productId });
            if (inventoryItem) {
                inventoryItem.stock += item.quantity;
                await inventoryItem.save();
                logger.info(`Restored stock for product ID: ${item.productId}. New stock: ${inventoryItem.stock}`);
            } else {
                logger.warn(`Product ID: ${item.productId} not found in inventory`);
            }
        }
        logger.info(`Order canceled event processed successfully. Order ID: ${orderDetails.orderId}`);
    } catch (error) {
        logger.error(`Error handling order canceled event: ${(error as Error).message}`);
    }
};
  