import { Request, Response } from 'express';
import Product, { IProduct } from '../models/Product.js';
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { z } from 'zod';
import logger from '../utils/logger.js';
import { enrichProductWithStock } from '../utils/getStockData.js';

dotenv.config();

const productSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    price: z.number().positive({ message: "Price must be a positive number" }),
    category: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid category ID",
    }),
    brand: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid brand ID",
    }),
    specifications: z.array(
        z.object({
            key: z.string(),
            value: z.string(),
        })
    ).optional(),
    images: z.array(z.string()).optional(),
});

export const createProduct = async (req: Request, res: Response) => {
    logger.info('Create product operation initiated.');
    try {
      const validatedData = productSchema.parse(req.body);
      const product: IProduct = new Product(validatedData);
      const savedProduct = await product.save();
      logger.info(`Product created successfully with ID: ${savedProduct._id}`);
      res.status(201).json(savedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn(`Validation error during product creation: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({ errors: error.errors });
      }
      logger.error(`Failed to create product: ${(error as Error).message}`);
      res.status(500).json({ error: 'Failed to create product' });
    }
  };
  
  export const getProducts = async (req: Request, res: Response) => {
    logger.info('Fetching all products.');
    try {
      const products = await Product.find().populate('category').populate('brand');
      const totalProducts = await Product.countDocuments();
  
      if (totalProducts === 0) {
        logger.warn('No products found.');
        return res.status(402).json({ message: "No products found", code: "NO_PRODUCTS" });
      }
  
      const productsWithStock = await Promise.all(products.map(enrichProductWithStock));
      logger.info(`Fetched ${totalProducts} products successfully.`);
      res.status(200).json({ total: totalProducts, products: productsWithStock });
    } catch (error) {
      logger.error(`Error fetching products: ${(error as Error).message}`);
      res.status(500).json({ error: 'Failed to fetch products. Server Error' });
    }
  };
  
  export const getBasicProductById = async (req: Request, res: Response) => {
    logger.info('Fetching basic product details by ID.');
    try {
      const { id } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        logger.warn(`Invalid product ID: ${id}`);
        return res.status(400).json({ error: 'Invalid product ID' });
      }
  
      const product = await Product.findById(id, 'name price image');
      if (!product) {
        logger.warn(`Product not found for ID: ${id}`);
        return res.status(404).json({ error: 'Product not found' });
      }
  
      logger.info(`Fetched product successfully for ID: ${id}`);
      res.status(200).json({ product });
    } catch (error) {
      logger.error(`Error fetching basic product details for ID ${req.params.id}: ${(error as Error).message}`);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  };
  
  export const validateProductById = async (req: Request, res: Response) => {
    logger.info('Validating product by ID.');
    try {
      const { productId } = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        logger.warn(`Invalid product ID: ${productId}`);
        return res.status(400).json({ error: 'Invalid product ID', validation: "false" });
      }
  
      const product = await Product.findById(productId);
      if (!product) {
        logger.warn(`Product not found for ID: ${productId}`);
        return res.status(404).json({ error: 'Product not found', validation: "false" });
      }
  
      logger.info(`Validation successful for product ID: ${productId}`);
      res.status(200).json({ validation: 'true' });
    } catch (error) {
      logger.error(`Error validating product ID ${req.body.productId}: ${(error as Error).message}`);
      res.status(500).json({ error: 'Failed to validate product', validation: "false" });
    }
  };
  
  export const getProductById = async (req: Request, res: Response) => {
    logger.info('Fetching product details by ID.');
    try {
      const { id } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        logger.warn(`Invalid product ID: ${id}`);
        return res.status(400).json({ error: 'Invalid product ID' });
      }
  
      const product = await Product.findById(id).populate('category').populate('brand');
      if (!product) {
        logger.warn(`Product not found for ID: ${id}`);
        return res.status(404).json({ error: 'Product not found' });
      }
  
      logger.info(`Fetched product successfully for ID: ${id}`);
  
      const stockResponse = await axios.get(`${process.env.INVENTORY_HOST}/api/inventory/get-stock/${id}`);
      const stock = stockResponse?.data?.inventory?.stock || 0;
      const productWithStock = { ...product.toObject(), stock };
  
      const relatedProducts = await Product.find({
        category: product.category,
        _id: { $ne: id },
      }).limit(5).populate('category').populate('brand');
  
      logger.info(`Fetched related products for category ID: ${product.category}`);
      res.status(200).json({ product: productWithStock, relatedProducts });
    } catch (error) {
      logger.error(`Error fetching product details for ID ${req.params.id}: ${(error as Error).message}`);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  };

//Upate product by ID
export const updateProduct = async (req: Request, res: Response) => {
    logger.info('Updating product by ID.');
    try {
      const { id } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        logger.warn(`Invalid product ID: ${id}`);
        return res.status(400).json({ error: 'Invalid product ID' });
      }
  
      const validatedData = productSchema.partial().parse(req.body);
  
      const updatedProduct = await Product.findByIdAndUpdate(id, validatedData, { new: true });
      if (!updatedProduct) {
        logger.warn(`Product not found for ID: ${id}`);
        return res.status(404).json({ error: 'Product not found' });
      }
  
      logger.info(`Product updated successfully for ID: ${id}`);
      res.status(200).json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn(`Validation error during product update: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({ errors: error.errors });
      }
      logger.error(`Error updating product for ID ${req.params.id}: ${(error as Error).message}`);
      res.status(500).json({ error: 'Failed to update product' });
    }
  };
  
  export const deleteProduct = async (req: Request, res: Response) => {
    logger.info('Deleting product by ID.');
    try {
      const { id } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        logger.warn(`Invalid product ID: ${id}`);
        return res.status(400).json({ error: 'Invalid product ID' });
      }
  
      const deletedProduct = await Product.findByIdAndDelete(id);
      if (!deletedProduct) {
        logger.warn(`Product not found for ID: ${id}`);
        return res.status(404).json({ error: 'Product not found' });
      }
  
      logger.info(`Product deleted successfully for ID: ${id}`);
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting product for ID ${req.params.id}: ${(error as Error).message}`);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  };
  
  export const getProductsByCategory = async (req: Request, res: Response) => {
    logger.info('Fetching products by category.');
    try {
      const { categoryId } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        logger.warn(`Invalid category ID: ${categoryId}`);
        return res.status(400).json({ error: 'Invalid category ID' });
      }
  
      const products = await Product.find({ category: new mongoose.Types.ObjectId(categoryId) })
        .populate('category')
        .populate('brand');
  
      if (products.length === 0) {
        logger.warn(`No products found for category ID: ${categoryId}`);
        return res.status(404).json({ error: 'No products found for this category' });
      }
  
      const productsWithStock = await Promise.all(products.map(enrichProductWithStock));
      logger.info(`Fetched ${productsWithStock.length} products for category ID: ${categoryId}`);
      res.status(200).json({ products: productsWithStock });
    } catch (error) {
      logger.error(`Error fetching products by category ID ${req.params.categoryId}: ${(error as Error).message}`);
      res.status(500).json({ error: 'Failed to fetch the products by category' });
    }
  };
  
  export const getProductsByBrand = async (req: Request, res: Response) => {
    logger.info('Fetching products by brand.');
    try {
      const { brandId } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(brandId)) {
        logger.warn(`Invalid brand ID: ${brandId}`);
        return res.status(400).json({ error: 'Invalid brand ID' });
      }
  
      const products = await Product.find({ brand: new mongoose.Types.ObjectId(brandId) })
        .populate('category')
        .populate('brand');
  
      if (products.length === 0) {
        logger.warn(`No products found for brand ID: ${brandId}`);
        return res.status(404).json({ error: 'No products found for this brand' });
      }
  
      const productsWithStock = await Promise.all(products.map(enrichProductWithStock));
      logger.info(`Fetched ${productsWithStock.length} products for brand ID: ${brandId}`);
      res.status(200).json({ products: productsWithStock });
    } catch (error) {
      logger.error(`Error fetching products by brand ID ${req.params.brandId}: ${(error as Error).message}`);
      res.status(500).json({ error: 'Failed to fetch the products by brand' });
    }
  };

  export const searchProducts = async (req: Request, res: Response) => {
    logger.info('Searching products.');
    try {
      const searchQuery = req.query.q as string;
  
      if (!searchQuery) {
        logger.warn('Search query is missing.');
        return res.status(400).json({ error: 'Search query is required' });
      }
  
      logger.info(`Performing search for query: "${searchQuery}"`);
      const products = await Product.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { tags: { $regex: searchQuery, $options: 'i' } },
        ],
      })
        .populate('category')
        .populate('brand');
  
      if (products.length === 0) {
        logger.warn(`No products found for query: "${searchQuery}"`);
        return res.status(404).json({ error: 'No products found!' });
      }
  
      const productsWithStock = await Promise.all(products.map(enrichProductWithStock));
  
      // Calculate price range
      const prices = products.map((product) => product.price);
      const priceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices),
      };

        const filters: Record<string, Set<any>> = products.reduce((acc, product) => {
            if (product.specifications) {
                product.specifications.forEach((spec) => {
                    const key = spec.key; // Use the specification key as the filter key
                    if (!acc[key]) {
                        acc[key] = new Set();
                    }
                    acc[key].add(spec.value); // Add the value to the Set
                });
            }
            return acc;
        }, {} as Record<string, Set<any>>);

        const filtersFormatted:  Record<string, any> = Object.fromEntries(
            Object.entries(filters).map(([key, values]) => [key, Array.from(values)])
        );
        filtersFormatted.priceRange = priceRange;

        logger.info(`Search completed. Found ${products.length} products for query: "${searchQuery}"`);
    res.status(200).json({ total: products.length, products: productsWithStock, filters: filtersFormatted });
  } catch (error) {
    logger.error(`Error during product search: ${(error as Error).message}`);
    res.status(500).json({ error: 'Failed to search products' });
  }
};

export const filterProducts = async (req: Request, res: Response) => {
  logger.info('Filtering products.');
  try {
    const filters: any = {};
    let sortOption = {};

    logger.info('Processing query parameters for filtering.');
    // Handle price range
    if (req.query.minPrice || req.query.maxPrice) {
      filters.price = {};
      if (req.query.minPrice) filters.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filters.price.$lte = Number(req.query.maxPrice);
    }

    // Handle search keyword
    if (req.query.keyword && typeof req.query.keyword === 'string') {
      const keyword = req.query.keyword.trim();
      filters.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { tags: { $regex: keyword, $options: 'i' } },
      ];
    }

    // Handle sort options
    if (req.query.sort && typeof req.query.sort === 'string') {
      const sortBy = req.query.sort.trim();
      if (sortBy === 'price-lowtohigh') sortOption = { price: 1 };
      else if (sortBy === 'price-hightolow') sortOption = { price: -1 };
      else if (sortBy === 'name-atoz') sortOption = { name: 1 };
      else if (sortBy === 'name-ztoa') sortOption = { name: -1 };
    }

    // Handle dynamic filters
    if (req.query.filters && typeof req.query.filters === 'string') {
      const dynamicFilters = JSON.parse(req.query.filters);
      const specificationFilters = [];

      for (const [key, values] of Object.entries(dynamicFilters)) {
        specificationFilters.push({
          specifications: {
            $elemMatch: {
              key,
              value: { $in: values },
            },
          },
        });
      }

      if (specificationFilters.length) {
        filters.$and = specificationFilters;
      }
    }

    logger.info('Query filters and sorting options processed.');

    // Query the database
    const products = await Product.find(filters)
      .sort(sortOption)
      .collation({ locale: 'en', strength: 2 })
      .populate('category')
      .populate('brand');

    if (products.length === 0) {
      logger.warn('No products found for the applied filters.');
      return res.status(404).json({ message: 'No products found' });
    }

    const productsWithStock = await Promise.all(products.map(enrichProductWithStock));

    logger.info(`Filtering completed. Found ${productsWithStock.length} products.`);
    res.status(200).json({ products: productsWithStock });
  } catch (error) {
    logger.error(`Error during product filtering: ${(error as Error).message}`);
    res.status(500).json({ error: 'Failed to filter products' });
  }
};




export const getFeaturedProducts = async (req: Request, res: Response) => {
    logger.info('Fetching featured products.');
    try {
      const featuredProducts = await Product.find({ isFeatured: true })
        .populate('brand')
        .populate('category');
  
      if (featuredProducts.length === 0) {
        logger.warn('No featured products found.');
        return res.status(404).json({ message: 'Featured products not found' });
      }
  
      logger.info(`Found ${featuredProducts.length} featured products.`);
      const productsWithStock = await Promise.all(featuredProducts.map(enrichProductWithStock));
  
      logger.info('Featured products fetched successfully with stock details.');
      res.status(200).json({
        code: 'SUCCESS',
        message: 'Featured products fetched successfully.',
        featuredProducts: productsWithStock,
      });
    } catch (error) {
      logger.error(`Error fetching featured products: ${(error as Error).message}`);
      res.status(500).json({
        code: 'ERROR',
        message: 'Server error while fetching featured products.',
      });
    }
  };



