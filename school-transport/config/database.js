const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD || 'school_transport_4.0',
  database: process.env.DB_NAME || 'school_transport',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  charset: 'utf8mb4',
  timezone: '+00:00'
});

module.exports = pool;
