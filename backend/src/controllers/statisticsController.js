const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection pool
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * Statistics Controller
 * Handles appointment statistics and reporting for administrators
 * 
 * Requirements Validation:
 * - Requirement 18: Appointment Statistics Reporting
 * - Requirement 19: No-Show Rate Reporting
 */

/**
 * Get Appointment Statistics
 * Returns comprehensive appointment statistics with filtering
 * 
 * Route: GET /api/statistics/appointments
 * Auth: Admin only
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7
 */
const getAppointmentStatistics = async (req, res) => {
    try {
        const { start_date, end_date, department_id, doctor_id } = req.query;
        
        // Build WHERE clause for filtering
        let whereConditions = ['1=1'];
        let queryParams = [];
        
        if (start_date) {
            whereConditions.push('a.appointment_date >= ?');
            queryParams.push(start_date);
        }
        
        if (end_date) {
            whereConditions.push('a.appointment_date <= ?');
            queryParams.push(end_date);
        }
        
        if (department_id) {
            whereConditions.push('d.department_id = ?');
            queryParams.push(department_id);
        }
        
        if (doctor_id) {
            whereConditions.push('a.doctor_id = ?');
            queryParams.push(doctor_id);
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        // Total appointments by status
        const [statusStats] = await db.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            WHERE ${whereClause}
            GROUP BY status
        `, queryParams);
        
        // Calculate total
        const totalAppointments = statusStats.reduce((sum, item) => sum + item.count, 0);
        
        // Format status statistics with percentages
        const statusStatistics = statusStats.map(stat => ({
            status: stat.status,
            count: stat.count,
            percentage: totalAppointments > 0 ? ((stat.count / totalAppointments) * 100).toFixed(2) : 0
        }));
        
        // Appointments by department
        const [departmentStats] = await db.query(`
            SELECT 
                dept.id as department_id,
                dept.name as department_name,
                COUNT(*) as count
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN departments dept ON d.department_id = dept.id
            WHERE ${whereClause}
            GROUP BY dept.id, dept.name
            ORDER BY count DESC
        `, queryParams);
        
        const departmentStatistics = departmentStats.map(stat => ({
            departmentId: stat.department_id,
            departmentName: stat.department_name,
            count: stat.count,
            percentage: totalAppointments > 0 ? ((stat.count / totalAppointments) * 100).toFixed(2) : 0
        }));
        
        // Appointments by doctor
        const [doctorStats] = await db.query(`
            SELECT 
                d.id as doctor_id,
                u.fullname as doctor_name,
                d.degree,
                dept.name as department_name,
                COUNT(*) as count,
                SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            JOIN departments dept ON d.department_id = dept.id
            WHERE ${whereClause}
            GROUP BY d.id, u.fullname, d.degree, dept.name
            ORDER BY count DESC
        `, queryParams);
        
        const doctorStatistics = doctorStats.map(stat => ({
            doctorId: stat.doctor_id,
            doctorName: `${stat.degree} ${stat.doctor_name}`,
            departmentName: stat.department_name,
            totalAppointments: stat.count,
            completedAppointments: stat.completed_count,
            cancelledAppointments: stat.cancelled_count,
            completionRate: stat.count > 0 ? ((stat.completed_count / stat.count) * 100).toFixed(2) : 0
        }));
        
        // Calculate average appointments per day
        let avgPerDay = 0;
        if (start_date && end_date) {
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            avgPerDay = daysDiff > 0 ? (totalAppointments / daysDiff).toFixed(2) : 0;
        }
        
        // Get daily trend
        const [dailyTrend] = await db.query(`
            SELECT 
                a.appointment_date,
                COUNT(*) as count,
                SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            WHERE ${whereClause}
            GROUP BY a.appointment_date
            ORDER BY a.appointment_date ASC
        `, queryParams);
        
        res.json({
            success: true,
            data: {
                summary: {
                    totalAppointments,
                    averagePerDay: parseFloat(avgPerDay),
                    dateRange: {
                        startDate: start_date || null,
                        endDate: end_date || null
                    }
                },
                byStatus: statusStatistics,
                byDepartment: departmentStatistics,
                byDoctor: doctorStatistics,
                dailyTrend: dailyTrend
            }
        });
        
    } catch (error) {
        console.error('Get appointment statistics error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Lỗi server khi lấy thống kê lịch hẹn'
            }
        });
    }
};

/**
 * Get No-Show Rate Statistics
 * Returns no-show rate statistics (appointments not checked-in)
 * 
 * Route: GET /api/statistics/no-show
 * Auth: Admin only
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7
 */
const getNoShowStatistics = async (req, res) => {
    try {
        const { start_date, end_date, department_id, doctor_id } = req.query;
        
        // Build WHERE clause for filtering
        let whereConditions = ['a.appointment_date < CURDATE()']; // Only past appointments
        let queryParams = [];
        
        if (start_date) {
            whereConditions.push('a.appointment_date >= ?');
            queryParams.push(start_date);
        }
        
        if (end_date) {
            whereConditions.push('a.appointment_date <= ?');
            queryParams.push(end_date);
        }
        
        if (department_id) {
            whereConditions.push('d.department_id = ?');
            queryParams.push(department_id);
        }
        
        if (doctor_id) {
            whereConditions.push('a.doctor_id = ?');
            queryParams.push(doctor_id);
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        // Overall no-show statistics
        const [overallStats] = await db.query(`
            SELECT 
                COUNT(*) as total_past_appointments,
                SUM(CASE WHEN a.status = 'booked' THEN 1 ELSE 0 END) as no_shows,
                SUM(CASE WHEN a.status IN ('checked_in', 'completed') THEN 1 ELSE 0 END) as attended,
                SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            WHERE ${whereClause}
        `, queryParams);
        
        const stats = overallStats[0];
        const noShowRate = stats.total_past_appointments > 0 
            ? ((stats.no_shows / stats.total_past_appointments) * 100).toFixed(2) 
            : 0;
        
        const attendanceRate = stats.total_past_appointments > 0
            ? ((stats.attended / stats.total_past_appointments) * 100).toFixed(2)
            : 0;
        
        // No-show statistics by doctor
        const [doctorNoShowStats] = await db.query(`
            SELECT 
                d.id as doctor_id,
                u.fullname as doctor_name,
                d.degree,
                dept.name as department_name,
                COUNT(*) as total_appointments,
                SUM(CASE WHEN a.status = 'booked' THEN 1 ELSE 0 END) as no_shows,
                SUM(CASE WHEN a.status IN ('checked_in', 'completed') THEN 1 ELSE 0 END) as attended
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            JOIN departments dept ON d.department_id = dept.id
            WHERE ${whereClause}
            GROUP BY d.id, u.fullname, d.degree, dept.name
            ORDER BY no_shows DESC
        `, queryParams);
        
        const doctorStatistics = doctorNoShowStats.map(stat => ({
            doctorId: stat.doctor_id,
            doctorName: `${stat.degree} ${stat.doctor_name}`,
            departmentName: stat.department_name,
            totalAppointments: stat.total_appointments,
            noShows: stat.no_shows,
            attended: stat.attended,
            noShowRate: stat.total_appointments > 0 ? ((stat.no_shows / stat.total_appointments) * 100).toFixed(2) : 0,
            attendanceRate: stat.total_appointments > 0 ? ((stat.attended / stat.total_appointments) * 100).toFixed(2) : 0
        }));
        
        // No-show statistics by department
        const [deptNoShowStats] = await db.query(`
            SELECT 
                dept.id as department_id,
                dept.name as department_name,
                COUNT(*) as total_appointments,
                SUM(CASE WHEN a.status = 'booked' THEN 1 ELSE 0 END) as no_shows,
                SUM(CASE WHEN a.status IN ('checked_in', 'completed') THEN 1 ELSE 0 END) as attended
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN departments dept ON d.department_id = dept.id
            WHERE ${whereClause}
            GROUP BY dept.id, dept.name
            ORDER BY no_shows DESC
        `, queryParams);
        
        const departmentStatistics = deptNoShowStats.map(stat => ({
            departmentId: stat.department_id,
            departmentName: stat.department_name,
            totalAppointments: stat.total_appointments,
            noShows: stat.no_shows,
            attended: stat.attended,
            noShowRate: stat.total_appointments > 0 ? ((stat.no_shows / stat.total_appointments) * 100).toFixed(2) : 0,
            attendanceRate: stat.total_appointments > 0 ? ((stat.attended / stat.total_appointments) * 100).toFixed(2) : 0
        }));
        
        // Monthly trend
        const [monthlyTrend] = await db.query(`
            SELECT 
                DATE_FORMAT(a.appointment_date, '%Y-%m') as month,
                COUNT(*) as total_appointments,
                SUM(CASE WHEN a.status = 'booked' THEN 1 ELSE 0 END) as no_shows,
                SUM(CASE WHEN a.status IN ('checked_in', 'completed') THEN 1 ELSE 0 END) as attended
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            WHERE ${whereClause}
            GROUP BY month
            ORDER BY month ASC
        `, queryParams);
        
        const monthlyStatistics = monthlyTrend.map(stat => ({
            month: stat.month,
            totalAppointments: stat.total_appointments,
            noShows: stat.no_shows,
            attended: stat.attended,
            noShowRate: stat.total_appointments > 0 ? ((stat.no_shows / stat.total_appointments) * 100).toFixed(2) : 0
        }));
        
        res.json({
            success: true,
            data: {
                summary: {
                    totalPastAppointments: stats.total_past_appointments,
                    noShows: stats.no_shows,
                    attended: stats.attended,
                    cancelled: stats.cancelled,
                    noShowRate: parseFloat(noShowRate),
                    attendanceRate: parseFloat(attendanceRate),
                    dateRange: {
                        startDate: start_date || null,
                        endDate: end_date || null
                    }
                },
                byDoctor: doctorStatistics,
                byDepartment: departmentStatistics,
                monthlyTrend: monthlyStatistics
            }
        });
        
    } catch (error) {
        console.error('Get no-show statistics error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Lỗi server khi lấy thống kê không đến khám'
            }
        });
    }
};

/**
 * Get Dashboard Overview
 * Returns overall system statistics for admin dashboard
 * 
 * Route: GET /api/statistics/dashboard
 * Auth: Admin only
 */
const getDashboardOverview = async (req, res) => {
    try {
        // Today's statistics
        const [todayStats] = await db.query(`
            SELECT 
                COUNT(*) as total_today,
                SUM(CASE WHEN status = 'booked' THEN 1 ELSE 0 END) as booked,
                SUM(CASE WHEN status = 'checked_in' THEN 1 ELSE 0 END) as checked_in,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
            FROM appointments
            WHERE appointment_date = CURDATE()
        `);
        
        // This month's statistics
        const [monthStats] = await db.query(`
            SELECT 
                COUNT(*) as total_month,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM appointments
            WHERE YEAR(appointment_date) = YEAR(CURDATE())
                AND MONTH(appointment_date) = MONTH(CURDATE())
        `);
        
        // Total users by role
        const [userStats] = await db.query(`
            SELECT 
                role,
                COUNT(*) as count
            FROM users
            GROUP BY role
        `);
        
        // Total doctors and departments
        const [doctorCount] = await db.query('SELECT COUNT(*) as count FROM doctors');
        const [deptCount] = await db.query('SELECT COUNT(*) as count FROM departments');
        
        res.json({
            success: true,
            data: {
                today: todayStats[0],
                thisMonth: monthStats[0],
                users: userStats,
                doctors: doctorCount[0].count,
                departments: deptCount[0].count
            }
        });
        
    } catch (error) {
        console.error('Get dashboard overview error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Lỗi server khi lấy tổng quan hệ thống'
            }
        });
    }
};

module.exports = {
    getAppointmentStatistics,
    getNoShowStatistics,
    getDashboardOverview
};
