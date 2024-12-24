import express, {Application} from 'express'
import dotenv from 'dotenv'
import cors from 'cors'

import connectDB from './db.js';
import orderRoutes from './routes/orderRoutes.js';
import { connectProducer } from './kafka/orderKafkaProducer.js';
import { connectConsumer } from './kafka/orderKafkaConsumer.js';
import { orderWorker } from './worker/orderQueue.js';
import cookieParser from 'cookie-parser';
import logger from './utils/logger.js';


dotenv.config();

const app: Application = express();

const PORT = process.env.PORT || 5100;

const allowedOrigins = [  
  process.env.ORIGIN1,
  process.env.ORIGIN2,
  process.env.ORIGIN3
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          },
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
connectProducer();
connectConsumer();

app.get('/', (req, res) => res.status(200).send('OK'));
app.use('/api/order', orderRoutes)

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Order Worker Events
logger.info('Starting the order worker...');
orderWorker.on('completed', (job) => {
  logger.info(`Job with ID ${job.id} completed successfully.`);
});

orderWorker.on('failed', (job, err) => {
  logger.error(`Job with ID ${job?.id} failed: ${(err as Error).message}`);
});

// Global Error Handler (optional for uncaught exceptions)
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1); // Exit process to avoid undefined behavior
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Promise Rejection: ${reason}`);
});

