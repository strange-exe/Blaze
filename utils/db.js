const mysql = require('mysql2/promise'); // <-- Use this

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = require('../config.json');

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Export pool and initialization
module.exports = {
    pool,

    // Initialize database tables
    initializeDatabase: async () => {
        const queries = [
            `
            CREATE TABLE IF NOT EXISTS join_settings (
                guild_id VARCHAR(255) PRIMARY KEY,
                embed BOOLEAN DEFAULT FALSE,
                embed_title TEXT DEFAULT NULL,
                embed_description TEXT DEFAULT NULL,
                embed_channel_id TEXT DEFAULT NULL,
                embed_media TEXT DEFAULT NULL,
                message TEXT DEFAULT 'Welcome to the server, {user}!',
                join_role_id VARCHAR(255) DEFAULT NULL
            )
            `,
            `
            CREATE TABLE IF NOT EXISTS server_prefixes (
                guild_id VARCHAR(255) PRIMARY KEY,
                prefix VARCHAR(10) DEFAULT '~'
            )
            `,
            `
            CREATE TABLE IF NOT EXISTS user_levels (
                user_id VARCHAR(255),
                guild_id VARCHAR(255),
                messages INT DEFAULT 0,
                level INT DEFAULT 1,
                PRIMARY KEY (user_id, guild_id)
            )
            `,
            // Guild roles table for level-based roles
            `
            CREATE TABLE IF NOT EXISTS guild_roles (
                guild_id VARCHAR(255),
                level INT,
                role_id VARCHAR(255),
                PRIMARY KEY (guild_id, level)
            )
            `
        ];

        const connection = await pool.getConnection(); // Get a connection from the pool

        try {
            for (const query of queries) {
                try {
                    await connection.query(query); // Use promise-based query
                    console.log('Table initialized successfully.');
                } catch (error) {
                    console.error('Error initializing table:', error);
                    console.error('Query failed:', query); // Log the query that failed
                }
            }
        } catch (error) {
            console.error('Error initializing database:', error);
        } finally {
            connection.release(); // Ensure the connection is released
        }
    },
};
