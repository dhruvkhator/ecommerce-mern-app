import pkg from 'pg';

const {Pool} = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'payment_service',
  password: 'OnePieceIsReal', // Use the same password from your Docker setup
  port: 5901 // Your custom port mapping
});

export default pool;
