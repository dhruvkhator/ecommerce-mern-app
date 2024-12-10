import { Router } from 'express';
import { createBrand, getBrands, getTopBrands } from '../controllers/brandController.js';
import logger from '../utils/logger.js';

const router: Router = Router();
router.use((req, res, next) => {
    logger.info(`Incoming request: Method - ${req.method}, URL - ${req.originalUrl}`);
    next();
});


router.post('/', createBrand);
router.get('/', getBrands);
router.get('/top', getTopBrands);

export default router;