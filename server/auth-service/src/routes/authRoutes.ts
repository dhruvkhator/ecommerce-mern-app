import { Router } from 'express';
import { signupUser, signinUser, logoutUser } from '../controllers/authController.js';
import logger from '../utils/logger.js';

const router = Router();

// Middleware for logging requests
router.use((req, res, next) => {
    logger.info(`Incoming request: ${req.method} ${req.originalUrl}`);
    next();
});

router.post('/signup', signupUser);
router.post('/signin', signinUser);
router.post('/logout', logoutUser);

export default router;
