/**
 * Script test đăng nhập sau khi cài đặt database
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testLogin() {
    let connection;
    
    try {
        console.log('🔍 Đang kiểm tra database...\n');
        
        // Kết nối database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'kltn_clinic',
            port: process.env.DB_PORT || 3307
        });

        console.log('✅ Kết nối database thành công!\n');
        
        // Kiểm tra số lượng dữ liệu
        const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
        const [deptCount] = await connection.execute('SELECT COUNT(*) as count FROM departments');
        const [doctorCount] = await connection.execute('SELECT COUNT(*) as count FROM doctors');
        
        console.log('📊 THỐNG KÊ DỮ LIỆU:');
        console.log(`   Users: ${userCount[0].count}`);
        console.log(`   Departments: ${deptCount[0].count}`);
        console.log(`   Doctors: ${doctorCount[0].count}\n`);
        
        if (userCount[0].count === 0) {
            console.log('❌ Database trống! Bạn cần import file kltn_clinic.sql');
            process.exit(1);
        }
        
        // Lấy danh sách users
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
        
        // Test password cho mỗi user
        const testPassword = 'Password123!';
        
        for (const user of users) {
            const isValid = await bcrypt.compare(testPassword, user.password);
            const status = isValid ? '✅' : '❌';
            const roleEmoji = {
                'admin': '👑',
                'doctor': '👨‍⚕️',
                'receptionist': '👔',
                'patient': '👤'
            }[user.role] || '👤';
            
            console.log(`${status} ${roleEmoji} ${user.role.toUpperCase()}: ${user.email}`);
            console.log(`   Tên: ${user.fullname}`);
            console.log(`   Password: ${testPassword} ${isValid ? '(OK)' : '(SAI)'}`);
            console.log('');
        }
        
        // Reset rate limits
        await connection.execute(`
            UPDATE users 
            SET login_attempts = 0, 
                locked_until = NULL
        `);
        
        console.log('🎉 CÀI ĐẶT HOÀN TẤT!\n');
        console.log('📝 BƯỚC TIẾP THEO:');
        console.log('   1. Khởi động backend: cd backend && npm start');
        console.log('   2. Khởi động frontend: cd frontend && npm start');
        console.log('   3. Mở trình duyệt: http://localhost:3000');
        console.log('   4. Đăng nhập với một trong các tài khoản ở trên\n');
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ LỖI:', error.message);
        
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\n💡 Database "kltn_clinic" chưa tồn tại!');
            console.log('   Làm theo hướng dẫn trong file HUONG_DAN_CAI_DAT.md\n');
        } else if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log('\n💡 Database chưa có dữ liệu!');
            console.log('   Import file: database/kltn_clinic.sql trong phpMyAdmin\n');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 MySQL chưa chạy!');
            console.log('   Mở XAMPP và Start MySQL\n');
        }
        
        process.exit(1);
    }
}

testLogin();
