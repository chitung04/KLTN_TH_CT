/**
 * Script để reset TẤT CẢ rate limits (bao gồm cả registration và login)
 * Chạy script này khi bị rate limited
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetAllRateLimits() {
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

        // 1. Reset login attempts và unlock tất cả user accounts
        const [userResult] = await connection.execute(`
            UPDATE users 
            SET login_attempts = 0, 
                locked_until = NULL 
            WHERE login_attempts > 0 OR locked_until IS NOT NULL
        `);
        console.log(`✅ Reset ${userResult.affectedRows} user account(s)`);

        // 2. Xóa tất cả rate limit records
        const [rateLimitResult] = await connection.execute(`
            DELETE FROM rate_limits
        `);
        console.log(`✅ Deleted ${rateLimitResult.affectedRows} rate limit record(s)`);

        // 3. Hiển thị các users
        const [users] = await connection.execute(`
            SELECT id, fullname, email, role 
            FROM users 
            ORDER BY created_at DESC
            LIMIT 10
        `);

        console.log('\n📋 Recent users:');
        users.forEach(user => {
            console.log(`   - ${user.fullname} (${user.email}) - Role: ${user.role}`);
        });

        console.log('\n🎉 TẤT CẢ rate limits đã được reset!');
        console.log('💡 Bây giờ bạn có thể:');
        console.log('   ✓ Đăng ký tài khoản mới');
        console.log('   ✓ Đăng nhập với tài khoản hiện có');
        console.log('   ✓ Reset mật khẩu');
        console.log('\n⏰ Lưu ý: Hệ thống rate limit:');
        console.log('   - Registration: 5 lần/IP/giờ');
        console.log('   - Login: 5 lần thất bại → khóa 15 phút');
        console.log('   - Password reset: 3 lần thất bại → khóa 15 phút');

    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log('\n💡 Bảng rate_limits chưa tồn tại. Đây là bình thường nếu bạn chưa tạo bảng này.');
            console.log('   User accounts đã được reset thành công.');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Chạy script
resetAllRateLimits()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
