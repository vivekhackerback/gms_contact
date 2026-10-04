require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'u109731178_gms_contact_u',
  password: process.env.DB_PASSWORD || 'Vivek@8651615629',
  database: process.env.DB_NAME || 'u109731178_gms_contact_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true // Return date and datetime as strings (prevents timezone skew)
});

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log(`[Database] Successfully connected to MySQL database "${process.env.DB_NAME || 'school_contacts_db'}" at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    conn.release();
    return true;
  } catch (err) {
    console.error('[Database Connection Error]: Could not connect to MySQL server.');
    console.error(`Reason: ${err.message}`);
    console.error('Make sure your MySQL server is running and database "school_contacts_db" is created.');
    return false;
  }
}

module.exports = {
  pool,
  query,
  testConnection
};
