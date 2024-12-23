import pkg from 'pg';
import dotenv from 'dotenv';
import logger from './utils/logger.js';

dotenv.config();

const {Pool} = pkg;

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASS, // Use the same password from your Docker setup
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10): undefined, // Your custom port mapping
  ssl: {
    rejectUnauthorized: false, // This bypasses SSL certificate validation for simplicity for development only
  },
});

pool.on("connect", () => {
  logger.info("Connected to the PostgreSQL database.");
});

pool.on("error", (err) => {
  logger.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(-1);
});


export default pool;

// CREATE TABLE payments (
//   payment_id VARCHAR(255) PRIMARY KEY,
//   user_id VARCHAR(255) NOT NULL,
//   order_id VARCHAR(255) NOT NULL,
//   amount NUMERIC(10, 2) NOT NULL,
//   status VARCHAR(50) DEFAULT 'Pending',
//   payer_id VARCHAR(255),
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );
