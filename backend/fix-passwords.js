/**
 * Fix tất cả passwords trong database
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixPasswords() {
    let connection;
    
    try {
        console.log('🔧 Đang sửa mật khẩu...\n');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'kltn_clinic',
            port: process.env.DB_PORT || 3307
        });

        console.log('✅ Kết nối database thành công!\n');
        
        // Tạo hash mới cho password "Password123!"
        const newPassword = 'Password123!';
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        console.log(`🔑 Password mới: ${newPassword}`);
        console.log(`🔐 Hash mới: ${hashedPassword}\n`);
        
        // Update tất cả users với password mới
        const [result] = await connection.execute(`
            UPDATE users 
            SET password = ?,
                login_attempts = 0,
                locked_until = NULL
            WHERE 1=1
        `, [hashedPassword]);
        
        console.log(`✅ Đã cập nhật ${result.affectedRows} users\n`);
        
        // Verify lại
        console.log('🔍 Kiểm tra lại...\n');
        
        const [users] = await connection.execute(`
            SELECT id, fullname, email, role, password 
            FROM users 
            ORDER BY 
                CASE role 
                    WHEN 'admin' THEN 1 
                    WHEN 'doctor' THEN 2 
                    WHEN 'receptionist' THEN 3 
                    WHEN 'patient' THEN 4 
                END, 
                id
        `);
        
        console.log('👥 DANH SÁCH TÀI KHOẢN:\n');
        
        for (const user of users) {
            const isValid = await bcrypt.compare(newPassword, user.password);
            const status = isValid ? '✅' : '❌';
            const roleEmoji = {
                'admin': '👑',
                'doctor': '👨‍⚕️',
                'receptionist': '👔',
                'patient': '👤'
            }[user.role] || '👤';
            
            console.log(`${status} ${roleEmoji} ${user.role.toUpperCase()}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Tên: ${user.fullname}`);
            console.log(`   Password: ${newPassword}`);
            console.log('');
        }
        
        console.log('🎉 HOÀN TẤT!\n');
        console.log('📝 Bây giờ bạn có thể đăng nhập với:');
        console.log(`   Email: chitung@gmail.com`);
        console.log(`   Password: ${newPassword}\n`);
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

fixPasswords();
