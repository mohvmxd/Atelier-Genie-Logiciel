const db = require('../config/database');

// filepath: /home/ghost/Projects Space/PROJECTS/Atelier_Genie_Logiciel_Project/school-transport/models/parentModel.js

const bcrypt = require('bcrypt');

const ParentModel = {
    async findByEmail(email) {
        const [rows] = await db.query(
            'SELECT id, fullname, email, password_hash FROM parents WHERE email = ?',
            [email]
        );
        return rows[0];
    },

    async findById(id) {
        const [rows] = await db.query(
            'SELECT id, fullname, phone, email FROM parents WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    // accepts plain-text password and hashes internally
    async create(fullname, phone, email, password) {
        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO parents (fullname, phone, email, password_hash) VALUES (?, ?, ?, ?)',
            [fullname, phone, email, password_hash]
        );
        return result.insertId;
    },

    async update(id, fullname, phone, email) {
        const [result] = await db.query(
            'UPDATE parents SET fullname = ?, phone = ?, email = ? WHERE id = ?',
            [fullname, phone, email, id]
        );
        return result.affectedRows > 0;
    },

    async getStudents(parentId) {
        const [rows] = await db.query(`
            SELECT s.id, s.fullname, sc.name AS school_name, st.name AS stop_name
            FROM students s
            JOIN parent_students ps ON s.id = ps.student_id
            LEFT JOIN schools sc ON s.school_id = sc.id
            LEFT JOIN stops st ON s.stop_id = st.id
            WHERE ps.parent_id = ? AND s.active = 1
        `, [parentId]);
        return rows;
    },

    async getTripHistory(studentId, limit = 30) {
        const [rows] = await db.query(`
            SELECT a.present, t.date, r.name AS route_name, b.plate_number
            FROM attendances a
            JOIN trip_days t ON a.trip_day_id = t.id
            JOIN routes r ON t.route_id = r.id
            JOIN buses b ON r.bus_id = b.id
            WHERE a.student_id = ?
            ORDER BY t.date DESC
            LIMIT ?
        `, [studentId, limit]);
        return rows;
    },

    async getUpcomingTrips(studentId) {
        const [rows] = await db.query(`
            SELECT DISTINCT r.id, r.name, r.departure_time, sc.name AS school_name
            FROM routes r
            JOIN students s ON s.school_id = r.school_id
            LEFT JOIN schools sc ON r.school_id = sc.id
            WHERE s.id = ? AND r.active = 1
            ORDER BY r.departure_time ASC
        `, [studentId]);
        return rows;
    },

    async isParentOfStudent(parentId, studentId) {
        const [rows] = await db.query(`
            SELECT COUNT(*) as count
            FROM parent_students ps
            WHERE ps.parent_id = ? AND ps.student_id = ?
        `, [parentId, studentId]);
        return rows[0].count > 0;
    },

    async getStudentAttendance(studentId, limit = 30) {
        const [rows] = await db.query(`
            SELECT a.present, t.date, r.name AS route_name, b.plate_number, s.fullname AS student_name
            FROM attendances a
            JOIN trip_days t ON a.trip_day_id = t.id
            JOIN routes r ON t.route_id = r.id
            JOIN buses b ON r.bus_id = b.id
            JOIN students s ON a.student_id = s.id
            WHERE a.student_id = ?
            ORDER BY t.date DESC
            LIMIT ?
        `, [studentId, limit]);
        return rows;
    }
};

module.exports = ParentModel;