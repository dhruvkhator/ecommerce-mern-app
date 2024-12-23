import { Queue, Worker } from 'bullmq';
import Order from '../models/Order.js';  
import mongoose from 'mongoose';
import { sendMessage } from '../kafka/orderKafkaProducer.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();


const redisConnection = {
  host: process.env.REDIS_HOST || "localhost", 
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined, // Convert to number
  username: "default", // Your Redis username (usually "default")
  password: process.env.REDIS_PASSWORD || "your-redis-cloud-password", // Set the password from Redis Cloud
  
};

// Create a new queue for handling order expiration
export const orderQueue = new Queue('orderQueue', {
  connection: redisConnection,
});


// Create a worker to process the expiration job
export const orderWorker = new Worker(
  'orderQueue',
  async (job) => {
    const { orderId } = job.data;
    logger.info(`OrderWorker started processing job for order ID: ${orderId}`);

    // Handle the expiration logic
    await handleOrderExpiration(orderId);
  },
  {
    connection: redisConnection,
  }
);

// Function that handles order expiration
const handleOrderExpiration = async (orderId: string) => {
  // Validate the orderId format
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    logger.error(`Invalid order ID: ${orderId}`);
    throw new Error(`Invalid order ID: ${orderId}`);
  }

  try {
    // Fetch the order from the database
    const order = await Order.findById(orderId);
    if (!order) {
      logger.warn(`Order not found: ${orderId}`);
      throw new Error(`Order not found: ${orderId}`);
    }

    // Check if the order is still in 'Pending' state
    if (order.status !== 'Pending') {
      logger.info(`Order ${orderId} is not in 'Pending' state. Current status: ${order.status}`);
      return; // No need to process if it's not 'Pending'
    }

    const orderDetails = {
      orderId,
      userId: order.user,
      products: order.products.map((product) => ({
        productId: product.product,
        quantity: product.quantity,
      })),
      status: order.status,
      timeStamp: new Date().toISOString(),
    };

    logger.info(`Order details prepared for order ID: ${orderId}. Details: ${JSON.stringify(orderDetails)}`);

    // Update the order status to 'Expired'
    order.status = 'Expired';
    await order.save();
    logger.info(`Order ${orderId} has been marked as 'Expired'.`);

    // Send Kafka messages for expired and canceled orders
    await sendMessage("order_expired", orderId);
    logger.info(`Order expired event sent to Kafka for order ID: ${orderId}.`);
    
    await sendMessage("order_canceled", orderDetails);
    logger.info(`Order canceled event sent to Kafka for order ID: ${orderId}.`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to process order ${orderId}: ${error.message}`);
    } else {
      logger.error(`Unknown error occurred while processing order ${orderId}`);
    }
    throw new Error(`Failed to process order ${orderId}: ${error}`);
  }
};
