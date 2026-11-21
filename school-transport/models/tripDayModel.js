const db = require('../config/database');

// filepath: /home/ghost/Projects Space/PROJECTS/Atelier_Genie_Logiciel_Project/school-transport/models/tripDayModel.js

const TripDayModel = {
    async generateForDate(date) {
        // Créer les trip_days pour chaque route active
        const [routes] = await db.query('SELECT id FROM routes WHERE active = 1');
        
        const created = [];
        for (const route of routes) {
            try {
                const [result] = await db.query(
                    `INSERT IGNORE INTO trip_days (route_id, date, status)
                     VALUES (?, ?, 'NON_DEMARREE')`,
                    [route.id, date]
                );
                if (result.affectedRows > 0) {
                    created.push({ route_id: route.id, date });
                }
            } catch (err) {
                console.error('Error creating trip day:', err);
            }
        }
        return created;
    },

    async countActiveBuses(date) {
        const [rows] = await db.query(`
            SELECT COUNT(DISTINCT r.bus_id) as count
            FROM trip_days t
            JOIN routes r ON t.route_id = r.id
            WHERE t.date = ? AND t.status IN ('EN_COURS', 'TERMINE')
        `, [date]);
        return rows[0]?.count || 0;
    },

    async updateStatus(id, status) {
        const [result] = await db.query(
            'UPDATE trip_days SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    },

    async getTripDayById(id) {
        const [rows] = await db.query(
            `SELECT t.*, r.name, b.plate_number, s.name as school_name
             FROM trip_days t
             JOIN routes r ON t.route_id = r.id
             JOIN buses b ON r.bus_id = b.id
             JOIN schools s ON r.school_id = s.id
             WHERE t.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    async getTripDaysByDate(date) {
        const [rows] = await db.query(
            `SELECT t.id, t.route_id, t.date, t.status, r.name, b.plate_number
             FROM trip_days t
             JOIN routes r ON t.route_id = r.id
             JOIN buses b ON r.bus_id = b.id
             WHERE t.date = ?
             ORDER BY r.departure_time ASC`,
            [date]
        );
        return rows;
    },

    async getAttendanceForTripDay(tripDayId) {
        const [rows] = await db.query(
            `SELECT a.id, a.student_id, st.fullname, a.present
             FROM attendances a
             JOIN students st ON a.student_id = st.id
             WHERE a.trip_day_id = ?
             ORDER BY st.fullname ASC`,
            [tripDayId]
        );
        return rows;
    },

    async markAttendance(tripDayId, studentId, present) {
        const [result] = await db.query(
            `INSERT INTO attendances (trip_day_id, student_id, present)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE present = ?`,
            [tripDayId, studentId, present ? 1 : 0, present ? 1 : 0]
        );
        return result.affectedRows > 0;
    }
};

module.exports = TripDayModel;