// Review Controller Functions
import Review from '../models/Review.js';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import logger from '../utils/logger.js';

interface xRequest extends Request{
    xid?:string;
    xrole?: string;
}

const addReviewSchema = z.object({
    productId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: 'Invalid product ID',
    }),
    rating: z.number().min(1).max(5, { message: 'Rating must be between 1 and 5' }),
    reviewText: z.string().min(1, { message: 'Review text is required' }),
    name: z.string().min(1, { message:"Name is required" })
});

const updateReviewSchema = z.object({
    rating: z.number().min(1).max(5, { message: 'Rating must be between 1 and 5' }).optional(),
    reviewText: z.string().min(1, { message: 'Review text is required' }).optional(),
});

// Add a Review
export const addReview = async (req: xRequest, res: Response) => {
    logger.info('Adding a new review.');
    try {
      const userId = req.xid;
      if (!userId) {
        logger.warn('Unauthorized attempt to add a review. User ID is missing.');
        return res.status(401).json({ message: 'Unauthorized. User ID is missing.' });
      }
  
      const validatedData = addReviewSchema.parse(req.body);
      const { productId, rating, reviewText, name } = validatedData;
  
      const newReview = await Review.create({
        productId,
        userId,
        rating,
        name,
        reviewText,
      });
  
      logger.info(`Review added successfully for product ID: ${productId} by user: ${userId}`);
      res.status(201).json({ message: 'Review added successfully.', review: newReview, code: 'SUCCESS' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn(`Validation error while adding review: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({ errors: error.errors });
      }
      logger.error(`Error adding review: ${(error as Error).message}`);
      res.status(500).json({ message: 'Server error while adding review.' });
    }
  };
  
  // Get All Reviews for a Product
  export const getReviewsByProduct = async (req: Request, res: Response) => {
    logger.info('Fetching reviews for a product.');
    try {
      const { productId } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        logger.warn(`Invalid product ID provided: ${productId}`);
        return res.status(400).json({ message: 'Invalid product ID.' });
      }
  
      const reviews = await Review.find({ productId });
      logger.info(`Fetched ${reviews.length} reviews for product ID: ${productId}`);
      res.status(200).json({ reviews });
    } catch (error) {
      logger.error(`Error fetching reviews for product ID ${req.params.productId}: ${(error as Error).message}`);
      res.status(500).json({ message: 'Server error while fetching reviews.' });
    }
  };
  
  // Update a Review
  export const updateReview = async (req: xRequest, res: Response) => {
    logger.info('Updating a review.');
    try {
      const userId = req.xid;
      if (!userId) {
        logger.warn('Unauthorized attempt to update a review. User ID is missing.');
        return res.status(401).json({ message: 'Unauthorized. User ID is missing.' });
      }
  
      const { reviewId } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        logger.warn(`Invalid review ID provided: ${reviewId}`);
        return res.status(400).json({ message: 'Invalid review ID.' });
      }
  
      const validatedData = updateReviewSchema.parse(req.body);
      const review = await Review.findById(reviewId);
  
      if (!review) {
        logger.warn(`Review not found for ID: ${reviewId}`);
        return res.status(404).json({ message: 'Review not found.' });
      }
      if (review.userId.toString() !== userId.toString()) {
        logger.warn(`Forbidden attempt to update review. User ${userId} does not own review ${reviewId}.`);
        return res.status(403).json({ message: 'Forbidden. You can only update your own reviews.' });
      }
  
      if (validatedData.rating !== undefined) review.rating = validatedData.rating;
      if (validatedData.reviewText !== undefined) review.reviewText = validatedData.reviewText;
      await review.save();
  
      logger.info(`Review updated successfully for ID: ${reviewId}`);
      res.status(200).json({ message: 'Review updated successfully.', review });
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn(`Validation error while updating review: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({ errors: error.errors });
      }
      logger.error(`Error updating review for ID ${req.params.reviewId}: ${(error as Error).message}`);
      res.status(500).json({ message: 'Server error while updating review.' });
    }
  };
  
  // Delete a Review
  export const deleteReview = async (req: xRequest, res: Response) => {
    logger.info('Deleting a review.');
    try {
      const userId = req.xid;
      if (!userId) {
        logger.warn('Unauthorized attempt to delete a review. User ID is missing.');
        return res.status(401).json({ message: 'Unauthorized. User ID is missing.' });
      }
  
      const { reviewId } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        logger.warn(`Invalid review ID provided: ${reviewId}`);
        return res.status(400).json({ message: 'Invalid review ID.' });
      }
  
      const review = await Review.findById(reviewId);
      if (!review) {
        logger.warn(`Review not found for ID: ${reviewId}`);
        return res.status(404).json({ message: 'Review not found.' });
      }
      if (review.userId.toString() !== userId.toString()) {
        logger.warn(`Forbidden attempt to delete review. User ${userId} does not own review ${reviewId}.`);
        return res.status(403).json({ message: 'Forbidden. You can only delete your own reviews.' });
      }
  
      await review.deleteOne();
      logger.info(`Review deleted successfully for ID: ${reviewId}`);
      res.status(200).json({ message: 'Review deleted successfully.' });
    } catch (error) {
      logger.error(`Error deleting review for ID ${req.params.reviewId}: ${(error as Error).message}`);
      res.status(500).json({ message: 'Server error while deleting review.' });
    }
  };
