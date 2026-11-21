const db = require('../config/database');

// filepath: /home/ghost/Projects Space/PROJECTS/Atelier_Genie_Logiciel_Project/school-transport/models/attendanceModel.js

const AttendanceModel = {
    async upsertList(tripDayId, list) {
        for (const line of list) {
            const { student_id, present } = line;
            await db.query(
                `INSERT INTO attendances (trip_day_id, student_id, present)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE present = VALUES(present)`,
                [tripDayId, student_id, present ? 1 : 0]
            );
        }
    },

    async countPresents(date) {
        const [rows] = await db.query(`
            SELECT COUNT(DISTINCT a.student_id) as count
            FROM attendances a
            JOIN trip_days t ON a.trip_day_id = t.id
            WHERE t.date = ? AND a.present = 1
        `, [date]);
        return rows[0].count;
    },

    async getByDateAndRoute(date, routeId) {
        const [rows] = await db.query(`
            SELECT a.id, a.student_id, a.present, s.fullname
            FROM attendances a
            JOIN trip_days t ON a.trip_day_id = t.id
            JOIN students s ON a.student_id = s.id
            WHERE t.date = ? AND t.route_id = ?
            ORDER BY s.fullname
        `, [date, routeId]);
        return rows;
    },

    async getByTripDay(tripDayId) {
        const [rows] = await db.query(`
            SELECT a.id, a.student_id, a.present, s.fullname
            FROM attendances a
            JOIN students s ON a.student_id = s.id
            WHERE a.trip_day_id = ?
            ORDER BY s.fullname
        `, [tripDayId]);
        return rows;
    },

    async getAbsentStudents(date, routeId) {
        const [rows] = await db.query(`
            SELECT DISTINCT s.id, s.fullname, s.stop_id
            FROM students s
            JOIN trip_days t ON s.school_id = (SELECT school_id FROM routes WHERE id = ?)
            LEFT JOIN attendances a ON a.trip_day_id = t.id AND a.student_id = s.id
            WHERE t.date = ? AND t.route_id = ? AND (a.present = 0 OR a.id IS NULL)
            ORDER BY s.fullname
        `, [routeId, date, routeId]);
        return rows;
    },

    async getDailyStats(date) {
        const [rows] = await db.query(`
            SELECT 
                COUNT(DISTINCT a.student_id) as total_marked,
                SUM(a.present) as present_count,
                SUM(CASE WHEN a.present = 0 THEN 1 ELSE 0 END) as absent_count
            FROM attendances a
            JOIN trip_days t ON a.trip_day_id = t.id
            WHERE t.date = ?
        `, [date]);
        return rows[0];
    }
};

module.exports = AttendanceModel;