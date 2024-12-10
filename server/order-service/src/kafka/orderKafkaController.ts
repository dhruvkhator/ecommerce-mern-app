import Order from "../models/Order.js";
import logger from "../utils/logger.js";
import { orderQueue } from "../worker/orderQueue.js";
import { sendMessage } from "./orderKafkaProducer.js";

type OrderId= {
    orderId: string;
}


export const handlePaymentCompleted = async (orderId: OrderId) => {
    console.log(orderId)
  logger.info("Handling payment completed event.");
  if (!orderId) {
      logger.warn("Received null order ID for payment completed event.");
      return;
  }

  try {
      const order = await Order.findOne({ _id: orderId });
      if (order) {
          const job = await orderQueue.getJob(order.jobId); // Fetch the job using the orderId
          if (job) {
              await job.remove(); // Remove the job to stop the expiration timer
              logger.info(`Expiration job for order ${orderId} removed successfully.`);
          }

          order.status = 'Processed';
          await order.save();
          logger.info(`Order status updated to 'Processed' for order ID: ${orderId}`);
      } else {
          logger.warn(`Order not found for order ID: ${orderId}`);
          return;
      }
  } catch (error) {
      logger.error(`Error handling payment completed event for order ID ${orderId.orderId}: ${(error as Error).message}`);
  }
};

export const handlePaymentFailed = async (orderId: OrderId) => {
  logger.info("Handling payment failed event.");
  if (!orderId) {
      logger.warn("Received null order ID for payment failed event.");
      return;
  }

  try {
      const order = await Order.findOne({ _id: orderId });
      if (order) {
          const job = await orderQueue.getJob(order.jobId); // Fetch the job using the orderId
          if (job) {
              await job.remove(); // Remove the job to stop the expiration timer
              logger.info(`Expiration job for order ${orderId} removed successfully.`);
          }
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

        await sendMessage('order_canceled', orderDetails)

          order.status = 'Cancelled';
          await order.save();
          logger.info(`Order status updated to 'Cancelled' for order ID: ${orderId}`);
      } else {
          logger.warn(`Order not found for order ID: ${orderId}`);
          return;
      }
  } catch (error) {
      logger.error(`Error handling payment failed event for order ID ${orderId}: ${(error as Error).message}`);
  }
};