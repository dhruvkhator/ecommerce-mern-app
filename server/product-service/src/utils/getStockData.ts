import axios from 'axios';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Fetches stock data from the inventory service and appends it to the product data.
 * @param product The product object to which stock data will be added.
 * @returns The product object with the stock data.
 */
export const enrichProductWithStock = async (product: any) => {
  try {
    const stockResponse = await axios.get(`${process.env.INVENTORY_HOST}/api/inventory/get-stock/${product._id}`);
    return { ...product.toObject(), stock: stockResponse.data.inventory.stock };
  } catch (error) {
    logger.error(`Failed to fetch stock for product ${product._id}: ${(error as Error).message}`);
    return { ...product.toObject(), stock: 0 }; // Default stock to 0 in case of error
  }
};
