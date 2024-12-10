import { Request, Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { z } from 'zod';


import User from '../models/User.js'
import Address from '../models/Address.js';
import logger from '../utils/logger.js';


dotenv.config();


const updateUserSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters long" }).optional(),
    email: z.string().email({ message: "Email is invalid" }).optional(),
});

interface xRequest extends Request {
    xid?: string;
    xrole?: string;
}

export const getUser = async (req: xRequest, res: Response) => {
    logger.info('Fetching user details.');
    try {
      const id = req.xid;
      if (!id) {
        logger.warn('Unauthorized attempt to fetch user details. User ID is missing.');
        return res.status(404).json({ message: 'User ID not found. Unauthorized' });
      }
  
      const userData = await User.findById(id);
      if (!userData) {
        logger.warn(`User not found for ID: ${id}`);
        return res.status(404).json({ message: 'User not found. Invalid ID or Token' });
      }
  
      const { password, ...userWithoutPassword } = userData.toObject();
      logger.info(`Fetched user details successfully for ID: ${id}`);
      res.status(200).json({ user: userWithoutPassword, code: 'SUCCESS' });
    } catch (error) {
      logger.error(`Error fetching user details: ${(error as Error).message}`);
      res.status(500).json({ error: 'Server error while getting user details' });
    }
  };
  
  // Update User
  export const updateUser = async (req: xRequest, res: Response) => {
    logger.info('Updating user details.');
    try {
      const id = req.xid;
      if (!id) {
        logger.warn('Unauthorized attempt to update user details. User ID is missing.');
        return res.status(404).json({ message: 'User ID not found. Unauthorized' });
      }
  
      const validatedData = updateUserSchema.parse(req.body);
  
      const updatedUser = await User.findByIdAndUpdate(id, validatedData, { new: true });
      if (!updatedUser) {
        logger.warn(`User not found for ID: ${id}`);
        return res.status(404).json({ error: 'User not found' });
      }
  
      const { password, ...userWithoutPassword } = updatedUser.toObject();
      logger.info(`User updated successfully for ID: ${id}`);
      res.status(200).json({ user: userWithoutPassword, message: 'User updated successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn(`Validation error while updating user: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({ errors: error.errors });
      }
      logger.error(`Error updating user details: ${(error as Error).message}`);
      res.status(500).json({ error: 'Server error while updating user' });
    }
  };
  
  // Add Address
  export const addAddress = async (req: xRequest, res: Response) => {
    logger.info('Adding a new address.');
    try {
      const id = req.xid;
      if (!id) {
        logger.warn('Unauthorized attempt to add address. User ID is missing.');
        return res.status(404).json({ message: 'User ID not found. Unauthorized' });
      }
  
      const addressData = req.body.addressData;
  
      const validatedAddress = z
        .object({
          title: z.string().min(1, { message: 'Title is required' }),
          street: z.string().min(1, { message: 'Street is required' }),
          city: z.string().min(3, { message: 'City is required' }),
          state: z.string().min(3, { message: 'State is required' }),
          pincode: z.string().min(6, { message: 'Pin Code is required' }),
          phone: z.string().min(10, { message: 'Phone number must be at least 10 digits' }),
        })
        .parse(addressData);
  
      const addressCount = await Address.countDocuments({ userId: id });
      if (addressCount >= 3) {
        logger.warn(`Address overflow for user ID: ${id}`);
        return res.status(400).json({ message: 'Cannot add more than 3 addresses', errorCode: 'ADDRESS_OVERFLOW' });
      }
  
      const address = new Address({ ...validatedAddress, userId: id });
      await address.save();
  
      logger.info(`Address added successfully for user ID: ${id}`);
      res.status(200).json({ address, message: 'Address added successfully', code: 'SUCCESS' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn(`Validation error while adding address: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({ errors: error.errors });
      }
      logger.error(`Error adding address: ${(error as Error).message}`);
      res.status(500).json({ error: 'Server error while adding address' });
    }
  };
  
  // Get All Addresses
  export const getAllAddress = async (req: xRequest, res: Response) => {
    logger.info('Fetching all addresses.');
    try {
      const userId = req.xid;
      if (!userId) {
        logger.warn('Unauthorized attempt to fetch addresses. User ID is missing.');
        return res.status(404).json({ message: 'User ID not found. Unauthorized' });
      }
  
      const addresses = await Address.find({ userId });
      if (addresses.length === 0) {
        logger.warn(`No addresses found for user ID: ${userId}`);
        return res.status(404).json({ message: 'No address found!' });
      }
  
      logger.info(`Fetched ${addresses.length} addresses for user ID: ${userId}`);
      res.status(200).json({ address: addresses });
    } catch (error) {
      logger.error(`Error fetching addresses for user ID: ${req.xid}: ${(error as Error).message}`);
      res.status(500).json({ error: 'Server error while getting address' });
    }
  };

  export const updateAddress = async (req: xRequest, res: Response) => {
    logger.info('Updating an address.');
    try {
      const userId = req.xid;
      const { addressId } = req.params; // Extract addressId from route parameters
      const addressData = req.body.addressData;
  
      if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
        logger.warn(`Invalid address ID provided: ${addressId}`);
        return res.status(404).json({ error: 'Invalid address ID' });
      }
  
      if (!userId) {
        logger.warn('Unauthorized attempt to update address. User ID is missing.');
        return res.status(404).json({ message: 'User ID not found. Unauthorized' });
      }
  
      // Validate address data using Zod schema
      const validatedAddress = z
        .object({
          title: z.string().min(1, { message: 'Title is required' }).optional(),
          street: z.string().min(1, { message: 'Street is required' }).optional(),
          city: z.string().min(1, { message: 'City is required' }).optional(),
          state: z.string().min(1, { message: 'State is required' }).optional(),
          pincode: z.string().min(5, { message: 'Pin Code is required' }).optional(),
          phone: z.string().min(10, { message: 'Phone number must be at least 10 digits' }).optional(),
        })
        .parse(addressData);
  
      const updatedAddress = await Address.findByIdAndUpdate(
        addressId,
        { $set: validatedAddress },
        { new: true } // Return the updated document
      );
  
      if (!updatedAddress) {
        logger.warn(`Address not found for ID: ${addressId}`);
        return res.status(404).json({ error: 'Address not found' });
      }
  
      logger.info(`Address updated successfully for ID: ${addressId}`);
      res.status(200).json({ updatedAddress, message: 'Address updated successfully', code: 'SUCCESS' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn(`Validation error while updating address: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({ errors: error.errors });
      }
      logger.error(`Error updating address for ID ${req.params.addressId}: ${(error as Error).message}`);
      res.status(500).json({ error: 'Server error while updating address' });
    }
  };
  
  export const deleteAddress = async (req: xRequest, res: Response) => {
    logger.info('Deleting an address.');
    try {
      const userId = req.xid;
      const { addressId } = req.params; // Extract addressId from route parameters
  
      if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
        logger.warn(`Invalid address ID provided: ${addressId}`);
        return res.status(404).json({ message: 'Invalid address ID' });
      }
  
      if (!userId) {
        logger.warn('Unauthorized attempt to delete address. User ID is missing.');
        return res.status(404).json({ message: 'User ID not found. Unauthorized' });
      }
  
      const deletedAddress = await Address.findByIdAndDelete(addressId);
  
      if (!deletedAddress) {
        logger.warn(`Address not found for ID: ${addressId}`);
        return res.status(404).json({ message: 'Address not found' });
      }
  
      logger.info(`Address deleted successfully for ID: ${addressId}`);
      res.status(200).json({ deletedAddress, message: 'Address deleted successfully', code: 'SUCCESS' });
    } catch (error) {
      logger.error(`Error deleting address for ID ${req.params.addressId}: ${(error as Error).message}`);
      res.status(500).json({ message: 'Server error while deleting address' });
    }
  };