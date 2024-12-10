import { Router } from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
  filterProducts,
  getBasicProductById,
  getProductsByBrand,
  validateProductById,
  getFeaturedProducts,
} from '../controllers/productController.js';
import logger from '../utils/logger.js';

const router: Router = Router();

router.use((req, res, next) => {
  logger.info(`Incoming request: Method - ${req.method}, URL - ${req.originalUrl}`);
  next();
});


// Define product routes
router.post('/', createProduct);
router.get('/', getProducts);
router.get('/basic/:id', getBasicProductById)
router.post('/validate', validateProductById)
router.get('/category/:categoryId', getProductsByCategory);
router.get('/brand/:brandId', getProductsByBrand)
router.get('/search', searchProducts);
router.get('/filter', filterProducts);
router.get('/feature', getFeaturedProducts)
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;