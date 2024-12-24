import express, {Application} from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import connectDB from './db.js';
import userRoutes from './routes/userRoutes.js';
import logger from './utils/logger.js';

dotenv.config();

const app: Application = express();

const PORT = process.env.PORT || 5050;

const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];

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

app.use('/api/user', userRoutes);


app.listen(PORT, ()=>{
  logger.info(`User-Service is running on port ${PORT}`);
})

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1); // Exit process to avoid undefined behavior
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Promise Rejection: ${reason}`);
});


