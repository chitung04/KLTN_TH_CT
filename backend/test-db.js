const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    try {
        console.log('Đang test kết nối database...');
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Kết nối MySQL thành công!');
        
        // Tạo database nếu chưa có
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Database ${process.env.DB_NAME} đã sẵn sàng`);
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Lỗi kết nối database:', error.message);
        console.log('\n📋 Hướng dẫn khắc phục:');
        console.log('1. Kiểm tra XAMPP MySQL đã khởi động chưa');
        console.log('2. Kiểm tra cấu hình trong file .env');
        console.log('3. Đảm bảo port 3306 không bị block');
    }
}

testConnection();