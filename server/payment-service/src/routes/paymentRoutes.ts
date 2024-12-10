import { Router } from 'express';
import { cancelPayment, createPayment, getPaymentById, getPaymentByUserAndOrder, getPaymentsByUser, updatePaymentStatus } from '../controllers/paymentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import logger from '../utils/logger.js';

const router = Router();

router.use((req, res, next) => {
    logger.info(`Incoming request: Method - ${req.method}, URL - ${req.originalUrl}`);
    next();
});


router.post('/', authMiddleware, createPayment );
router.patch('/:paymentId/status', updatePaymentStatus);
router.get('/', authMiddleware, getPaymentsByUser);
router.get('/:paymentId', getPaymentById);
router.patch('/:orderId/cancel', cancelPayment);
router.get('/payment', getPaymentByUserAndOrder)

export default router;