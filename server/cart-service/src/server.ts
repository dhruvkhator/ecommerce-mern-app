import express, {Application} from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import connectDB from './db.js';
import cartRoutes from './routes/cartRoutes.js';
import logger from './utils/logger.js';


dotenv.config();

const app: Application = express();

const PORT = process.env.PORT || 5350;

app.use(
    cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Cache-Control",
        "Expires",
        "Pragma",
      ],
      credentials: true,
    })
  );
app.use(cookieParser());
app.use(express.json())
app.use(express.urlencoded({ extended: true}));


connectDB();

app.use('/api/cart', cartRoutes )


app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});

// Global Error Handler (optional for uncaught exceptions)
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1); // Exit process to avoid undefined behavior
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Promise Rejection: ${reason}`);
});


