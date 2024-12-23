import pool from '../db.js';
import logger from '../utils/logger.js';

type OrderId = {
    orderId: string;
}

export const handleOrderExpired = async (orderId: OrderId) => {
    logger.info("Processing order_expired event in payment Kafka consumer.");
    
    if (!orderId) {
      logger.warn("Received null or invalid order details for order_expired event.");
      return;
    }
  
    try {
      logger.info(`Checking payment status for order ID: ${orderId}`);
      const query = `SELECT * FROM payments WHERE order_id = $1;`;
      const order = await pool.query(query, [orderId]);
      console.log("fetched")
  
      if (order.rows.length !== 0) {
        logger.info(`Payment record found for order ID: ${orderId}. Updating status to 'Failed'.`);
        
        const subquery = `UPDATE payments SET status='Failed', updated_at=CURRENT_TIMESTAMP WHERE order_id=$1;`;
        await pool.query(subquery, [orderId]);
        console.log("updated")
  
        logger.info(`Payment status updated to 'Failed' for order ID: ${orderId}`);
      } else {
        logger.warn(`No payment record found for order ID: ${orderId}`);
        return;
      }
    } catch (error) {
      logger.error(`Error handling order_expired event for order ID ${orderId}: ${(error as Error).message}`);
    }
  };