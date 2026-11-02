const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        console.log('🔍 Checking current database structure...');

        // Check users table structure
        const [userColumns] = await connection.execute('DESCRIBE users');
        console.log('Users table structure:');
        console.table(userColumns);

        // Check if users table exists and get its primary key
        const [tables] = await connection.execute('SHOW TABLES LIKE "users"');
        console.log('Tables matching "users":', tables);

        await connection.end();

    } catch (error) {
        console.error('❌ Error checking database:', error);
        process.exit(1);
    }
}

checkDatabase();