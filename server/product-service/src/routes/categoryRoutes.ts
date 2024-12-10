import { Router } from 'express';
import { createCategory, getCategories, getTopCategories } from '../controllers/categoryController.js';
import logger from '../utils/logger.js';

const router: Router = Router();

router.use((req, res, next) => {
    logger.info(`Incoming request: Method - ${req.method}, URL - ${req.originalUrl}`);
    next();
});


router.post('/', createCategory);
router.get('/', getCategories);
router.get('/top', getTopCategories);

export default router;