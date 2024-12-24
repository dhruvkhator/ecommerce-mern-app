import express, {Application} from 'express'
import dotenv from 'dotenv'
import cors from 'cors'

import connectDB from './db.js';
import categoryRoutes from './routes/categoryRoutes.js'
import productRoutes from './routes/productRoutes.js'
import brandRoutes from './routes/brandRoutes.js'
import logger from './utils/logger.js';

dotenv.config();

const app: Application = express();

const PORT = process.env.PORT || 5000;

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
app.use(express.json())
app.use(express.urlencoded({ extended: true}));


connectDB();
app.get('/', (req, res) => res.status(200).send('OK'));
app.use('/api/brand', brandRoutes)
app.use('/api/category', categoryRoutes)
app.use('/api/product', productRoutes)


app.listen(PORT, ()=>{
  logger.info(`Product-Service is running on port ${PORT}`);
})

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1); // Exit process to avoid undefined behavior
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Promise Rejection: ${reason}`);
});

