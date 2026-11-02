const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateDatabase() {
    try {
        // Create connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            multipleStatements: true
        });

        console.log('🔄 Updating database schema for authentication...');

        // 1. Add authentication fields to users table
        console.log('📝 Adding authentication fields to users table...');
        await connection.execute(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL,
            ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL,
            ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) NULL,
            ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP NULL,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);

        // 2. Create indexes for performance optimization
        console.log('🔍 Creating database indexes...');
        try {
            await connection.execute('CREATE INDEX idx_users_email_verified ON users(email, email_verified)');
        } catch (err) {
            if (!err.message.includes('Duplicate key name')) console.log('Index idx_users_email_verified already exists');
        }
        
        try {
            await connection.execute('CREATE INDEX idx_users_reset_token ON users(password_reset_token)');
        } catch (err) {
            if (!err.message.includes('Duplicate key name')) console.log('Index idx_users_reset_token already exists');
        }
        
        try {
            await connection.execute('CREATE INDEX idx_users_locked_until ON users(locked_until)');
        } catch (err) {
            if (!err.message.includes('Duplicate key name')) console.log('Index idx_users_locked_until already exists');
        }

        // 3. Create auth_audit_logs table
        console.log('📋 Creating auth_audit_logs table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS auth_audit_logs (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                action VARCHAR(50) NOT NULL,
                ip_address VARCHAR(45) NOT NULL,
                user_agent TEXT,
                success BOOLEAN NOT NULL,
                failure_reason VARCHAR(255) NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_audit_user (user_id),
                INDEX idx_audit_action (action),
                INDEX idx_audit_timestamp (timestamp),
                INDEX idx_audit_ip (ip_address)
            )
        `);

        // 4. Create user_sessions table
        console.log('💾 Creating user_sessions table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                session_id VARCHAR(255) PRIMARY KEY,
                user_id INT NOT NULL,
                token_hash VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_sessions_user (user_id),
                INDEX idx_user_sessions_expires (expires_at),
                INDEX idx_user_sessions_token (token_hash)
            )
        `);

        // 5. Check table structure
        console.log('✅ Verifying table structure...');
        const [userColumns] = await connection.execute('DESCRIBE users');
        console.log('Users table columns:', userColumns.map(col => col.Field));

        const [auditColumns] = await connection.execute('DESCRIBE auth_audit_logs');
        console.log('Auth audit logs table created with columns:', auditColumns.map(col => col.Field));

        await connection.end();
        console.log('✅ Database schema updated successfully!');

    } catch (error) {
        console.error('❌ Error updating database:', error);
        process.exit(1);
    }
}

updateDatabase();