import { Request, Response } from 'express';
import Inventory from '../models/Inventory.js';
import mongoose from 'mongoose';
import logger from "../utils/logger.js"; // Import logger

export const addStock = async (req: Request, res: Response) => {
    logger.info("Add stock operation initiated.");
    try {
        const { productId, quantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            logger.warn(`Invalid product ID: ${productId}`);
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        if (quantity <= 0) {
            logger.warn(`Invalid quantity provided: ${quantity}`);
            return res.status(400).json({ error: 'Quantity must be greater than zero' });
        }

        let inventoryItem = await Inventory.findOne({ productId });
        if (!inventoryItem) {
            logger.info(`Product not found in inventory. Creating new item for product ID: ${productId}`);
            inventoryItem = new Inventory({ productId, stock: quantity });
        } else {
            logger.info(`Product found in inventory. Updating stock for product ID: ${productId}`);
            inventoryItem.stock += quantity;
        }

        await inventoryItem.save();
        logger.info(`Stock added successfully for product ID: ${productId}. New stock: ${inventoryItem.stock}`);
        res.status(200).json({ message: 'Stock added successfully', inventory: inventoryItem });
    } catch (error) {
        logger.error(`Error adding stock: ${(error as Error).message}`);
        res.status(500).json({ error: 'Server error while adding stock' });
    }
};

export const reduceStock = async (req: Request, res: Response) => {
    logger.info("Reduce stock operation initiated.");
    try {
        const { productId, quantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            logger.warn(`Invalid product ID: ${productId}`);
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        if (quantity <= 0) {
            logger.warn(`Invalid quantity provided: ${quantity}`);
            return res.status(400).json({ error: 'Quantity must be greater than zero' });
        }

        const inventoryItem = await Inventory.findOne({ productId });
        if (!inventoryItem) {
            logger.warn(`Product not found in inventory for product ID: ${productId}`);
            return res.status(404).json({ error: 'Product not found in inventory' });
        }

        if (inventoryItem.stock < quantity) {
            logger.warn(`Insufficient stock for product ID: ${productId}. Available: ${inventoryItem.stock}, Requested: ${quantity}`);
            return res.status(400).json({ error: 'Insufficient stock available' });
        }

        inventoryItem.stock -= quantity;
        await inventoryItem.save();
        logger.info(`Stock reduced successfully for product ID: ${productId}. Remaining stock: ${inventoryItem.stock}`);
        res.status(200).json({ message: 'Stock reduced successfully', inventory: inventoryItem });
    } catch (error) {
        logger.error(`Error reducing stock: ${(error as Error).message}`);
        res.status(500).json({ error: 'Server error while reducing stock' });
    }
};

export const getStock = async (req: Request, res: Response) => {
    logger.info("Get stock operation initiated.");
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            logger.warn(`Invalid product ID: ${productId}`);
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const inventoryItem = await Inventory.findOne({ productId });
        if (!inventoryItem) {
            logger.warn(`Product not found in inventory for product ID: ${productId}`);
            return res.status(404).json({ error: 'Product not found in inventory' });
        }

        logger.info(`Stock fetched successfully for product ID: ${productId}. Stock: ${inventoryItem.stock}`);
        res.status(200).json({ inventory: inventoryItem });
    } catch (error) {
        logger.error(`Error fetching stock: ${(error as Error).message}`);
        res.status(500).json({ error: 'Server error while fetching stock' });
    }
};

export const getLowStockProducts = async (req: Request, res: Response) => {
    logger.info("Get low stock products operation initiated.");
    try {
        const lowStockItems = await Inventory.find({ stock: { $lte: 10 } });

        if (!lowStockItems.length) {
            logger.info("No low stock products found.");
            return res.status(200).json({ message: 'No products are low on stock' });
        }

        logger.info(`Low stock products fetched successfully. Count: ${lowStockItems.length}`);
        res.status(200).json({ lowStockItems });
    } catch (error) {
        logger.error(`Error fetching low stock products: ${(error as Error).message}`);
        res.status(500).json({ error: 'Server error while fetching low stock products' });
    }
};

