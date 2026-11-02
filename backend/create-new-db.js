const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function createNewDatabase() {
    try {
        console.log('🔄 Đang tạo/cập nhật database KLTN Clinic...');
        
        // Kết nối MySQL không chỉ định database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });

        // Đọc và thực thi script SQL
        const sqlScript = fs.readFileSync('../database/kltn_clinic.sql', 'utf8');
        
        // Tách các câu lệnh SQL
        const statements = sqlScript.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (let statement of statements) {
            const trimmedStatement = statement.trim();
            if (trimmedStatement && !trimmedStatement.startsWith('--')) {
                try {
                    await connection.execute(trimmedStatement);
                    console.log('✅ Executed:', trimmedStatement.split('\n')[0].substring(0, 50) + '...');
                } catch (err) {
                    if (!err.message.includes('already exists')) {
                        console.log('⚠️ Warning:', err.message);
                    }
                }
            }
        }
        
        console.log('✅ Database KLTN Clinic đã được cập nhật thành công!');
        await connection.end();
        
    } catch (error) {
        console.error('❌ Lỗi tạo database:', error.message);
    }
}

createNewDatabase();