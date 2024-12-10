import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { addProductToCart, getProductQuantityById, removeProductFromCart, updateProductQuantity, viewCart } from "../controllers/cartController.js";
import logger from "../utils/logger.js"; // Import logger

const router = Router();

// Middleware to log all incoming requests
router.use((req, res, next) => {
    logger.info(`Incoming request: Method - ${req.method}, URL - ${req.originalUrl}`);
    next();
});

router.post('/', authMiddleware, addProductToCart);
router.get('/', authMiddleware, viewCart);
router.put('/:productId', authMiddleware, updateProductQuantity);
router.delete('/:productId', authMiddleware, removeProductFromCart);
router.get('/:productId', authMiddleware, getProductQuantityById);

export default router;
