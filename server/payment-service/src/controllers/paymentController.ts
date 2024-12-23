import { Request, Response } from 'express';
import pool from '../db.js';
import { z } from 'zod';
import paypal from '../paypal-config.js';
import { sendPaymentEvent } from '../kafka/paymentKafkaProducer.js';
import logger from '../utils/logger.js';

// Payment Schema Validation with Zod
const createPaymentSchema = z.object({
  userId: z.string({ message: "Invalid user ID format" }),
  orderId: z.string({ message: "Invalid order ID format" }),
  amount: z.number().positive({ message: "Amount must be greater than 0" })
});

interface xRequest extends Request {
  xid?: string;
  xrole?: string;
}


export const createPayment = async (req: xRequest, res: Response) => {
  logger.info("Create payment operation initiated.");
  try {
    logger.debug(`Request body: ${JSON.stringify(req.body.data)}`);

    const validatedData = createPaymentSchema.parse({
      userId: req.xid,
      orderId: req.body.data.orderId,
      amount: req.body.data.amount,
    });
    const { userId, orderId, amount } = validatedData;

    logger.info(`Payment creation validated for user ID: ${userId}, order ID: ${orderId}, amount: ${amount}`);

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "http://localhost:5173/shop/paypal-return",
        cancel_url: "http://localhost:5173/shop/paypal-cancel",
      },
      transactions: [
        {
          amount: {
            currency: "USD",
            total: amount.toFixed(2),
          },
          description: `Payment for Order #${orderId}`,
        },
      ],
    };

    paypal.payment.create(create_payment_json, async (error: any, payment: any) => {
      if (error) {
        logger.error(`PayPal Payment Creation Error: ${error.message}`);
        return res.status(500).json({ message: "Error creating PayPal payment." });
      }

      const approvalUrl = payment?.links.find((link: any) => link.rel === "approval_url")?.href;
      const paymentId = payment.id;

      logger.info(`PayPal payment created successfully. Payment ID: ${paymentId}`);

      // Insert payment data into the database
      const query = `
        INSERT INTO payments (user_id, order_id, amount, status, payment_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const values = [userId, orderId, amount, "Pending", paymentId];
      pool
        .query(query, values)
        .then((result) => {
          logger.info(`Payment data saved to database successfully. Payment ID: ${paymentId}`);
          return res.status(201).json({
            message: "Payment created successfully.",
            approval_url: approvalUrl,
            payment: result.rows[0],
          });
        })
        .catch((dbError) => {
          logger.error(`Database Error while saving payment: ${dbError.message}`);
          return res.status(500).json({ message: "Error saving payment to the database." });
        });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error(`Validation error during payment creation: ${JSON.stringify(error.errors)}`);
      return res.status(400).json({ errors: error.errors });
    }
    logger.error(`Error creating payment: ${(error as Error).message}`);
    return res.status(500).json({ message: "Server error while creating payment." });
  }
};

const updatePaymentSchema = z.object({
  status: z.enum(['Pending', 'Completed', 'Failed', 'Refunded'], {
    message: "Invalid payment status",
  }),
  payerId: z
    .string()
    .regex(/^[a-zA-Z0-9]+$/, {
      message: "payerId must be alphanumeric.",
    })
    .optional()
    .nullable(),
});

const getPaymentsByUserSchema = z.object({
  userId: z.string({ message: "Invalid user ID format" }),
});

const getPaymentByIdSchema = z.object({
  paymentId: z.number({ message: "Invalid payment ID format" }),
});

export const updatePaymentStatus = async (req: Request, res: Response) => {
  logger.info("Update payment status operation initiated.");
  try {
    const { paymentId } = req.params;
    const validatedData = updatePaymentSchema.parse(req.body);
    const { status, payerId } = validatedData;

    logger.info(`Validated payment update for payment ID: ${paymentId}, status: ${status}`);

    // Update payment status in the payments table
    const query = `
      UPDATE payments
      SET status = $1, payer_id = $3, updated_at = CURRENT_TIMESTAMP
      WHERE payment_id = $2
      RETURNING *;
    `;
    const values = [status, paymentId, payerId];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      logger.warn(`Payment not found for ID: ${paymentId}`);
      return res.status(404).json({ message: 'Payment not found.' });
    }

    logger.info(`Payment status updated in database for payment ID: ${paymentId}, new status: ${status}`);

    // Send Kafka events for completed or failed payments
    if (status === 'Completed') {
      await sendPaymentEvent('payment_completed', result.rows[0].order_id);
      logger.info(`Kafka event sent: payment_completed for order ID: ${result.rows[0].order_id}`);
    }
    if (status === 'Failed') {
      await sendPaymentEvent('payment_failed', result.rows[0].order_id);
      logger.info(`Kafka event sent: payment_failed for order ID: ${result.rows[0].order_id}`);
    }

    res.status(200).json({
      message: 'Payment status updated successfully.',
      payment: result.rows[0],
      code: "SUCCESS",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error(`Validation error during payment update: ${JSON.stringify(error.errors)}`);
      return res.status(400).json({ errors: error.errors });
    }
    logger.error(`Error updating payment status: ${(error as Error).message}`);
    res.status(500).json({ message: 'Server error while updating payment status.' });
  }
};

export const getPaymentsByUser = async (req: xRequest, res: Response) => {
  logger.info("Get payments by user operation initiated.");
  try {
    const userId = req.xid;

    if (!userId) {
      logger.warn("Unauthorized access: User ID missing.");
      return res.status(401).json({ message: "User not authorized" });
    }

    // Validate userId
    const validatedData = getPaymentsByUserSchema.parse({ userId });
    logger.info(`Fetching payments for user ID: ${validatedData.userId}`);

    const query = `SELECT * FROM payments WHERE user_id = $1;`;
    const result = await pool.query(query, [validatedData.userId]);

    if (result.rows.length === 0) {
      logger.info(`No payments found for user ID: ${validatedData.userId}`);
      return res.status(404).json({ message: 'No payments found for this user.' });
    }

    logger.info(`Payments fetched successfully for user ID: ${validatedData.userId}. Payment count: ${result.rows.length}`);
    res.status(200).json({ payments: result.rows });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error(`Validation error during getPaymentsByUser: ${JSON.stringify(error.errors)}`);
      return res.status(400).json({ errors: error.errors });
    }
    logger.error(`Error fetching payments by user: ${(error as Error).message}`);
    res.status(500).json({ message: 'Server error while fetching payments.' });
  }
};

export const getPaymentById = async (req: Request, res: Response) => {
  logger.info("Get payment by ID operation initiated.");
  try {
    const { paymentId } = req.params;

    // Validate paymentId
    const validatedData = getPaymentByIdSchema.parse({ paymentId });
    logger.info(`Fetching payment details for payment ID: ${validatedData.paymentId}`);

    const query = `SELECT * FROM payments WHERE payment_id = $1;`;
    const result = await pool.query(query, [validatedData.paymentId]);

    if (result.rows.length === 0) {
      logger.warn(`Payment not found for ID: ${validatedData.paymentId}`);
      return res.status(404).json({ message: 'Payment not found.' });
    }

    logger.info(`Payment details fetched successfully for payment ID: ${validatedData.paymentId}`);
    res.status(200).json({ payment: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error(`Validation error during getPaymentById: ${JSON.stringify(error.errors)}`);
      return res.status(400).json({ errors: error.errors });
    }
    logger.error(`Error fetching payment by ID: ${(error as Error).message}`);
    res.status(500).json({ message: 'Server error while fetching payment.' });
  }
};


export const cancelPayment = async (req: Request, res: Response) => {
  logger.info("Cancel payment operation initiated.");
  try {
    const { orderId } = req.params;

    if (!orderId) {
      logger.warn("Order ID is missing in the request.");
      return res.status(404).json({ message: "Order ID not found" });
    }

    // Check if payment is in Pending state before canceling
    const checkQuery = `SELECT status FROM payments WHERE order_id = $1;`;
    const checkResult = await pool.query(checkQuery, [orderId]);

    if (checkResult.rows.length === 0) {
      logger.warn(`Payment not found for order ID: ${orderId}`);
      return res.status(404).json({ message: "Payment not found." });
    }

    if (checkResult.rows[0].status !== 'Pending') {
      logger.warn(`Payment for order ID: ${orderId} is not in Pending state. Current status: ${checkResult.rows[0].status}`);
      return res.status(400).json({ message: "Only payments in Pending state can be cancelled." });
    }

    // Cancel the payment
    const query = `
      UPDATE payments
      SET status = 'Failed', updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [orderId]);

    logger.info(`Payment for order ID: ${orderId} has been updated to 'Failed'.`);

    // Send Kafka event for payment failed
    await sendPaymentEvent("payment_failed", result.rows[0].order_id);
    logger.info(`Kafka event sent: payment_failed for order ID: ${orderId}`);

    res.status(200).json({
      message: "Payment cancelled successfully.",
      payment: result.rows[0],
      code: "SUCCESS",
    });
  } catch (error) {
    logger.error(`Error cancelling payment for order ID ${req.params.orderId}: ${(error as Error).message}`);
    res.status(500).json({ message: "Server error while cancelling payment." });
  }
};

export const getPaymentByUserAndOrder = async (req: Request, res: Response) => {
  logger.info("Get payment by user and order operation initiated.");
  try {
    const { userId, orderId } = req.params;

    if (!userId || !orderId) {
      logger.warn("User ID or Order ID is missing in the request.");
      return res.status(400).json({ message: "Both userId and orderId are needed!" });
    }

    const query = `SELECT * FROM payments WHERE user_id = $1 AND order_id = $2;`;
    const result = await pool.query(query, [userId, orderId]);

    if (result.rows.length === 0) {
      logger.warn(`No payment information found for user ID: ${userId} and order ID: ${orderId}`);
      return res.status(404).json({ message: "No payment info found for this user's order." });
    }

    logger.info(`Payment details fetched successfully for user ID: ${userId} and order ID: ${orderId}`);
    res.status(200).json({ payment: result.rows[0] });
  } catch (error) {
    logger.error(`Error fetching payment for user ID ${req.params.userId} and order ID ${req.params.orderId}: ${(error as Error).message}`);
    res.status(500).json({ message: "Server error while getting payment info by user and order ID." });
  }
};
