import { Router } from "express";

import authMiddleware from "../middlewares/authMiddleware.js";
import { addReview, deleteReview, getReviewsByProduct, updateReview } from "../controllers/reviewController.js";
import logger from "../utils/logger.js";


const router = Router();

router.use((req, res, next) => {
    logger.info(`Incoming request: Method - ${req.method}, URL - ${req.originalUrl}`);
    next();
  });
  

router.post("/", authMiddleware ,addReview);
router.get("/:productId", getReviewsByProduct);
router.put("/:reviewId", authMiddleware ,updateReview);
router.delete("/:reviewId/delete", authMiddleware, deleteReview)

export default router;