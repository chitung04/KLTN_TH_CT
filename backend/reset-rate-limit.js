/**
 * Script để reset rate limit và unlock user accounts
 * Chạy script này khi bị rate limited hoặc account bị lock
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetRateLimitAndUnlockAccounts() {
    let connection;
    
    try {
        // Kết nối database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'kltn_clinic'
        });

        console.log('✅ Connected to database');

        // Reset login attempts và unlock tất cả accounts
        const [result] = await connection.execute(`
            UPDATE users 
            SET login_attempts = 0, 
                locked_until = NULL 
            WHERE login_attempts > 0 OR locked_until IS NOT NULL
        `);

        console.log(`✅ Reset ${result.affectedRows} user account(s)`);

        // Hiển thị các users đã được unlock
        const [users] = await connection.execute(`
            SELECT id, fullname, email, role 
            FROM users 
            LIMIT 10
        `);

        console.log('\n📋 Available users:');
        users.forEach(user => {
            console.log(`   - ${user.fullname} (${user.email}) - Role: ${user.role}`);
        });

        console.log('\n🎉 Rate limit đã được reset!');
        console.log('💡 Bây giờ bạn có thể đăng nhập lại.');
        console.log('⏰ Lưu ý: Hệ thống rate limit:');
        console.log('   - Login/Register: 5 lần thất bại → khóa 15 phút');
        console.log('   - Password reset: 3 lần thất bại → khóa 15 phút');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Chạy script
resetRateLimitAndUnlockAccounts()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
