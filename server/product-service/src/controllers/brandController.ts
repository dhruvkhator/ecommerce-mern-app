import { Request, Response } from 'express';
import Brand, { IBrand } from '../models/Brand.js';
import Product from '../models/Product.js';
import logger from '../utils/logger.js';

// Create a new Brand
export const createBrand = async (req: Request, res: Response) => {
    logger.info('Create brand operation initiated.');
    try {
      const brand: IBrand = new Brand(req.body);
      const savedBrand = await brand.save();
      logger.info(`Brand created successfully with ID: ${savedBrand._id}`);
      res.status(201).json(savedBrand);
    } catch (error) {
      logger.error(`Failed to create brand: ${(error as Error).message}`);
      res.status(500).json({ error: 'Failed to create Brand' });
    }
  };
  
  // Get all brands
  export const getBrands = async (req: Request, res: Response) => {
    logger.info('Fetching all brands.');
    try {
      const brands = await Brand.find();
      logger.info(`Fetched ${brands.length} brands successfully.`);
      res.status(200).json(brands);
    } catch (error) {
      logger.error(`Failed to fetch brands: ${(error as Error).message}`);
      res.status(500).json({ error: 'Failed to fetch brands' });
    }
  };
  
  // Get top brands
  export const getTopBrands = async (req: Request, res: Response) => {
    logger.info('Fetching top brands based on product count.');
    try {
      const topBrands = await Product.aggregate([
        { $group: { _id: "$brand", productCount: { $sum: 1 } } },
        { $sort: { productCount: -1 } },
        { $limit: 5 },
      ]);
  
      if (!topBrands.length) {
        logger.warn('No top brands found.');
        return res.status(404).json({ error: "No brands found" });
      }
  
      logger.info(`Top brands identified. Count: ${topBrands.length}`);
  
      // Fetch full Brand details using the IDs from aggregation
      const brandIds = topBrands.map((brand) => brand._id);
      const brands = await Brand.find({ _id: { $in: brandIds } });
  
      logger.info(`Fetched full details for top brands. Count: ${brands.length}`);
      return res.status(200).json({ brands });
    } catch (error) {
      logger.error(`Error fetching top brands: ${(error as Error).message}`);
      return res.status(500).json({ error: 'Failed to fetch the brands' });
    }
  };
