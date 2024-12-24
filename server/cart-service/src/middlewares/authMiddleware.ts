import jwt from 'jsonwebtoken';
import pkg from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import logger from '../utils/logger.js'; // Import logger

const { JsonWebTokenError, TokenExpiredError } = pkg;

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

interface AuthReqBody extends Request {
    xid?: string;
    xrole?: string;
}

const authMiddleware = (req: AuthReqBody, res: Response, next: NextFunction) => {
    logger.info("Auth middleware initiated.");
    try {
        const token = req.cookies.user_token;
        console.log(req.cookies.user_token)

        if (!token) {
            logger.warn("Unauthorized access attempt: Missing token.");
            return res.status(401).json({ error: 'Unauthorized - Missing token', errorCode: "NO_TOKEN" });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
        logger.info(`Token verification successful for user ID: ${decoded.id}`);

        if (!decoded.id) {
            logger.warn("Unauthorized access attempt: Missing user ID in token.");
            return res.status(401).json({ error: 'Unauthorized - Missing ID', errorCode: "NO_ID" });
        }

        req.xid = decoded.id;
        if (decoded.role) {
            req.xrole = decoded.role;
            logger.info(`User role assigned: ${decoded.role}`);
        }

        next();
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            logger.warn("Unauthorized access: Token expired.");
            return res.status(401).json({ error: 'Unauthorized - Token expired', errorCode: "EXPIRE_TOKEN" });
        } else if (error instanceof JsonWebTokenError) {
            logger.warn("Unauthorized access: Invalid token.");
            return res.status(401).json({ error: 'Unauthorized - Invalid token', errorCode: "INVALID_TOKEN" });
        } else {
            logger.error(`Unexpected error in auth middleware: ${(error as Error).message}`);
            return res.status(500).json({ error: "Server error while verifying token" });
        }
    }
};

export default authMiddleware;
