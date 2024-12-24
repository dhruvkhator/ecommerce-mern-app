// Cart Controller Functions with Microservice Updates and Zod Validation
import Cart from '../models/Cart.js';
import axios from 'axios';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import logger from '../utils/logger.js';

// Add Product to Cart
const addProductToCartSchema = z.object({
  productId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid product ID',
  }),
  quantity: z.number().min(1, { message: 'Quantity must be at least 1' })
});

// Update Product Quantity in Cart
const updateProductQuantitySchema = z.object({
    quantity: z.number().min(1, { message: 'Quantity must be at least 1' })
  });
  

  interface xRequest extends Request{
    xid?:string;
    xrole?: string;
}
interface ProductResponse {
  product:{
    _id: string;
    name: string;
    price: number;
  }
}

export const addProductToCart = async (req: xRequest, res: Response) => {
  logger.info("Add product to cart initiated.");
  try {
      const userId = req.xid;
      if (!userId) {
          logger.warn("Unauthorized attempt to add product to cart.");
          return res.status(401).json({ message: 'Unauthorized. User ID is missing.' });
      }

      const validatedData = addProductToCartSchema.parse(req.body);
      const { productId, quantity } = validatedData;
      logger.info(`Validated data: Product ID - ${productId}, Quantity - ${quantity}`);

      const productResponse = await axios.get<ProductResponse>(`http://product-service:5000/api/product/basic/${productId}`);
      const product = productResponse.data.product;

      if (!product) {
          logger.warn(`Product not found: ${productId}`);
          return res.status(404).json({ message: 'Product not found.' });
      }

      let cart = await Cart.findOne({ userId });
      if (!cart) {
          cart = await Cart.create({ userId, products: [] });
          logger.info(`New cart created for user ID: ${userId}`);
      }

      const productIndex = cart.products.findIndex((item) => item.product.toString() === productId);
      if (productIndex > -1) {
          cart.products[productIndex].quantity += quantity;
          logger.info(`Updated quantity for product ID: ${productId}`);
      } else {
          cart.products.push({
              product: new mongoose.Types.ObjectId(productId),
              name: product.name,
              price: product.price,
              quantity,
          });
          logger.info(`Added new product to cart: ${productId}`);
      }

      await cart.save();
      logger.info(`Cart updated successfully for user ID: ${userId}`);
      res.status(200).json({ message: 'Product added to cart successfully!', cart, code: "SUCCESS" });
  } catch (error) {
      if (error instanceof z.ZodError) {
          logger.error(`Validation error: ${JSON.stringify(error.errors)}`);
          return res.status(400).json({ errors: error.errors });
      }
      logger.error(`Error adding product to cart: ${(error as Error).message}`);
      res.status(500).json({ message: 'Server error while adding product to cart!' });
  }
};

export const viewCart = async (req: xRequest, res: Response) => {
  logger.info("View cart operation initiated.");
  try {
      const userId = req.xid;
      if (!userId) {
          logger.warn("Unauthorized attempt to view cart.");
          return res.status(401).json({ message: 'Unauthorized. User ID is missing.' });
      }

      const cart = await Cart.findOne({ userId });
      if (!cart) {
          logger.info("Cart is empty.");
          return res.status(200).json({ message: 'Cart is empty.', cart: [], code: "EMPTY" });
      }

      let priceUpdated = false;
      for (let item of cart.products) {
          try {
              const productResponse = await axios.get<ProductResponse>(`http://product-service:5000/api/product/basic/${item.product}`);
              const product = productResponse.data.product;
              if (product && product.price !== item.price) {
                  item.price = product.price;
                  priceUpdated = true;
                  logger.info(`Price updated for product ID: ${item.product}`);
              }
          } catch (error) {
              logger.warn(`Failed to fetch product ${item.product}: ${(error as Error).message}`);
          }
      }

      if (priceUpdated) {
          await cart.save();
      }

      logger.info(`Cart viewed successfully for user ID: ${userId}`);
      res.status(200).json({ cart, code: "SUCCESS" });
  } catch (error) {
      logger.error(`Error viewing cart: ${(error as Error).message}`);
      res.status(500).json({ message: 'Server error while viewing cart.' });
  }
};


export const updateProductQuantity = async (req: xRequest, res: Response) => {
  logger.info("Update product quantity initiated.");
  try {
      const userId = req.xid;
      if (!userId) {
          logger.warn("Unauthorized attempt to update product quantity.");
          return res.status(401).json({ message: 'Unauthorized. User ID is missing.' });
      }

      const { productId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
          logger.warn(`Invalid product ID: ${productId}`);
          return res.status(400).json({ message: 'Invalid product ID.' });
      }

      const validatedData = updateProductQuantitySchema.parse(req.body);
      const { quantity } = validatedData;
      logger.info(`Validated data: Product ID - ${productId}, Quantity - ${quantity}`);

      let cart = await Cart.findOne({ userId });
      if (!cart) {
          logger.warn(`Cart not found for user ID: ${userId}`);
          return res.status(404).json({ message: 'Cart not found.' });
      }

      const productIndex = cart.products.findIndex((item) => item.product.toString() === productId);
      if (productIndex === -1) {
          logger.warn(`Product not found in cart: ${productId}`);
          return res.status(404).json({ message: 'Product not found in cart.' });
      }

      if (quantity === 0) {
          cart.products = cart.products.filter((item) => item.product.toString() !== productId);
          logger.info(`Product removed from cart: ${productId}`);
      } else {
          cart.products[productIndex].quantity = quantity;
          logger.info(`Updated product quantity: ${productId}, Quantity: ${quantity}`);
      }

      await cart.save();
      logger.info(`Cart updated successfully for user ID: ${userId}`);
      res.status(200).json({ message: 'Product quantity updated successfully.', cart, code: "SUCCESS" });
  } catch (error) {
      if (error instanceof z.ZodError) {
          logger.error(`Validation error: ${JSON.stringify(error.errors)}`);
          return res.status(400).json({ errors: error.errors });
      }
      logger.error(`Error updating product quantity in cart: ${(error as Error).message}`);
      res.status(500).json({ message: 'Server error while updating product quantity in cart.' });
  }
};

export const removeProductFromCart = async (req: xRequest, res: Response) => {
  logger.info("Remove product from cart initiated.");
  try {
      const userId = req.xid;
      if (!userId) {
          logger.warn("Unauthorized attempt to remove product from cart.");
          return res.status(401).json({ message: 'Unauthorized. User ID is missing.' });
      }

      const { productId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
          logger.warn(`Invalid product ID: ${productId}`);
          return res.status(400).json({ message: 'Invalid product ID.' });
      }

      let cart = await Cart.findOne({ userId });
      if (!cart) {
          logger.warn(`Cart not found for user ID: ${userId}`);
          return res.status(404).json({ message: 'Cart not found.' });
      }

      cart.products = cart.products.filter((item) => item.product.toString() !== productId);
      logger.info(`Product removed from cart: ${productId}`);

      await cart.save();
      logger.info(`Cart updated successfully after product removal for user ID: ${userId}`);
      res.status(200).json({ message: 'Product removed from cart successfully.', cart, code: "SUCCESS" });
  } catch (error) {
      logger.error(`Error removing product from cart: ${(error as Error).message}`);
      res.status(500).json({ message: 'Server error while removing product from cart.' });
  }
};

export const getProductQuantityById = async (req: xRequest, res: Response) => {
  logger.info("Get product quantity by ID initiated.");
  try {
      const userId = req.xid;
      if (!userId) {
          logger.warn("Unauthorized attempt to get product quantity.");
          return res.status(401).json({ message: 'Unauthorized. User ID is missing.' });
      }

      const { productId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
          logger.warn(`Invalid product ID: ${productId}`);
          return res.status(400).json({ message: 'Invalid product ID.' });
      }

      let cart = await Cart.findOne({ userId });
      if (!cart) {
          logger.warn(`Cart not found for user ID: ${userId}`);
          return res.status(404).json({ message: 'Cart not found.' });
      }

      const product = cart.products.filter((item) => item.product.toString() === productId);
      if (!product.length) {
          logger.warn(`Product not found in cart: ${productId}`);
          return res.status(404).json({ message: 'Product not found in the cart of this user.' });
      }

      logger.info(`Product quantity retrieved: ${productId}, Quantity: ${product[0].quantity}`);
      res.status(200).json({ quantity: product[0].quantity, code: "SUCCESS" });
  } catch (error) {
      logger.error(`Error getting product quantity: ${(error as Error).message}`);
      res.status(500).json({ message: 'Server error while retrieving product quantity.' });
  }
};

