import { Request, Response } from 'express';
import Category, { ICategory } from '../models/Category.js';
import Product from '../models/Product.js';
import logger from '../utils/logger.js';

// Create a new category
export const createCategory = async (req: Request, res: Response) => {
    logger.info('Create category operation initiated.');
    try {
      const category: ICategory = new Category(req.body);
      const savedCategory = await category.save();
      logger.info(`Category created successfully with ID: ${savedCategory._id}`);
      res.status(201).json(savedCategory);
    } catch (error) {
      logger.error(`Failed to create category: ${(error as Error).message}`);
      res.status(500).json({ error: 'Failed to create category' });
    }
  };
  
  // Get all categories
  export const getCategories = async (req: Request, res: Response) => {
    logger.info('Fetching all categories.');
    try {
      const categories = await Category.find();
      logger.info(`Fetched ${categories.length} categories successfully.`);
      res.status(200).json(categories);
    } catch (error) {
      logger.error(`Failed to fetch categories: ${(error as Error).message}`);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  };
  
  // Get top categories
  export const getTopCategories = async (req: Request, res: Response) => {
    logger.info('Fetching top categories based on product count.');
    try {
      const topCategories = await Product.aggregate([
        { $group: { _id: "$category", productCount: { $sum: 1 } } },
        { $sort: { productCount: -1 } },
        { $limit: 5 },
      ]);
  
      if (!topCategories.length) {
        logger.warn('No top categories found.');
        return res.status(404).json({ error: "No categories found" });
      }
  
      logger.info(`Top categories identified. Count: ${topCategories.length}`);
  
      const categoryIds = topCategories.map((category) => category._id);
      const categories = await Category.find({ _id: { $in: categoryIds } });
  
      logger.info(`Fetched full details for top categories. Count: ${categories.length}`);
      return res.status(200).json({ categories });
    } catch (error) {
      logger.error(`Error fetching top categories: ${(error as Error).message}`);
      return res.status(500).json({ error: 'Failed to fetch the categories' });
    }
  };
