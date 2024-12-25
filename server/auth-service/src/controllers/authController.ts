import { Request, Response } from 'express';
import dotenv from 'dotenv';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import User from '../models/User.js'


dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET  as string;


const userSignupSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters long" }),
    email: z.string().email({ message: "Email is invalid" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
})

const userSigninSchema = z.object({
    email: z.string().email({ message: "Email is invalid" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters long" })
})


export const signupUser = async (req: Request, res: Response) => {
    logger.info("Signup process started.");

    try {

        const validatedData = userSignupSchema.parse(req.body);
        console.log(validatedData)

        const existingUser = await User.findOne({ email: validatedData.email })
        if (existingUser) {
            logger.warn(`Signup failed: User with email ${validatedData.email} already exists.`);
            return res.status(403).json({ message: "User with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(validatedData.password, 10);
        logger.info("Password hashing completed successfully.");

        const newUser = await User.create({ ...validatedData, password: hashedPassword });
        logger.info(`User created successfully with email: ${newUser.email}`);

        res.status(201).json({ message: 'User registered successfully', code:"SUCCESS" })

    } catch (error) {
        if (error instanceof z.ZodError) {
            logger.error(`Validation error: ${JSON.stringify(error.errors)}`);
            return res.status(400).json({ errors: error.errors });
        }
        logger.error(`Unexpected error during signup: ${(error as Error).message}`);
        res.status(500).json({ error: "Server error while signing up user" })
    }
}


export const signinUser = async (req: Request, res: Response) => {
    logger.info("Signin process started.");

    try {
        const validatedData = userSigninSchema.parse(req.body);
        logger.info("Signin data validation successful.");

        const user = await User.findOne({ email: validatedData.email });
        if (!user) {
            logger.warn(`Signin failed: User with email ${validatedData.email} not found.`);
            return res.status(404).json({ message: "User not found!" });
        }

        const isMatch = await bcrypt.compare(validatedData.password, user.password);
        if (!isMatch) {
            logger.warn(`Signin failed: Invalid credentials for email ${validatedData.email}.`);
            return res.status(403).json({ message: "Invalid credentials" });
        }

        const payload = { id: user._id, role: user.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: 24 * 60 * 60 * 1000 });
        logger.info(`Token generated successfully for user: ${user.email}`);

        res.cookie("user_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000,
        });

        const { password, ...userResponse } = user.toObject();
        res.status(200).json({ user: userResponse, token, message: "Successfully signed in!", code: "SUCCESS" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            logger.error(`Validation error: ${JSON.stringify(error.errors)}`);
            return res.status(400).json({ errors: error.errors });
        }
        logger.error(`Unexpected error during signin: ${(error as Error).message}`);
        res.status(500).json({ error: "Server error while signing in user" });
    }
};

export const logoutUser = async (req: Request, res: Response) => {
    logger.info("Logout process initiated.");

    try {
        res.clearCookie("user_token").json({ 
            message: "Logged out successfully", 
            code: "SUCCESS" 
        });
        logger.info("User logged out successfully.");
    } catch (error) {
        logger.error(`Error during logout: ${(error as Error).message}`);
        res.status(500).json({ error: "Server error while logging out user" });
    }
};
