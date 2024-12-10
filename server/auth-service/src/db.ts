import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "./utils/logger.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI as string;

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        logger.info("MongoDB connected successfully.");
    } catch (error) {
        logger.error(`MongoDB connection error: ${(error as Error).message}`);
        process.exit(1); // Exit process with failure
    }
};

export default connectDB;
