import { Router } from 'express';
import { getUserOrders, updateOrderStatus, getAllOrders, cancelOrder, createOrder, autoCancelOrder, getOrderDetailsById } from '../controllers/orderController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import logger from '../utils/logger.js';

const router = Router();


router.use((req, res, next) => {
    logger.info(`Incoming request: Method - ${req.method}, URL - ${req.originalUrl}`);
    next();
});


// Get orders for a user
router.get('/', authMiddleware ,getUserOrders);

router.post('/',authMiddleware, createOrder)

// Update the status of an order (admin only)
router.patch('/:orderId/status',  updateOrderStatus);

// Get all orders (admin only)
router.get('/all', getAllOrders);

// Cancel an order (user)
router.patch('/:orderId/cancel', authMiddleware ,cancelOrder);
router.patch('/:ordeId/auto-cancel', autoCancelOrder);
router.get("/:orderId/details",authMiddleware, getOrderDetailsById);

export default router;
