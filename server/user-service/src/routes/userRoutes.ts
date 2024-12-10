import { Router } from 'express';
import { updateUser, addAddress, updateAddress, deleteAddress, getUser, getAllAddress } from '../controllers/userController.js';
import authMiddleware from '../middlewares/userMiddleware.js';
import logger from '../utils/logger.js';

const router = Router();

router.use((req, res, next) => {
    logger.info(`Incoming request: Method - ${req.method}, URL - ${req.originalUrl}`);
    next();
  });

router.get('/check-auth', authMiddleware, getUser);
// Update User Profile Route
router.patch('/profile', authMiddleware, updateUser);

router.get('/address', authMiddleware, getAllAddress)
// Add New Address
router.post('/address', authMiddleware, addAddress);

// Update Specific Address
router.patch('/address/:addressId', authMiddleware, updateAddress);

// Delete Specific Address
router.delete('/address/:addressId', authMiddleware, deleteAddress);

export default router;