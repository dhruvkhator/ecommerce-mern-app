import express, {Application} from 'express'
import dotenv from 'dotenv'
import cors from 'cors'

import connectDB from './db.js';
import reviewRoutes from './routes/reviewRoutes.js';
import cookieParser from 'cookie-parser';
import logger from './utils/logger.js';


dotenv.config();

const app: Application = express();

const PORT = process.env.PORT || 5300;

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
app.get('/', (req, res) => res.status(200).send('OK'));
app.use('/api/review', reviewRoutes )


app.listen(PORT, ()=>{
  logger.info(`Review-Service is running on port ${PORT}`);
})

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1); // Exit process to avoid undefined behavior
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Promise Rejection: ${reason}`);
});


