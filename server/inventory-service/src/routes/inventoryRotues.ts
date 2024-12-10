import { Router } from 'express';
import { addStock, getLowStockProducts, getStock, reduceStock } from '../controllers/inventoryController.js';
import logger from '../utils/logger.js';

const router = Router();

router.use((req, res, next) => {
    logger.info(`Incoming request: Method - ${req.method}, URL - ${req.originalUrl}`);
    next();
});


router.post('/add-stock', addStock);
router.post('/reduce-stock', reduceStock);
router.get('/get-stock/:productId', getStock);
router.get('/low-stock', getLowStockProducts);

export default router;
