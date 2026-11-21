const db = require('../config/database');

// filepath: /home/ghost/Projects Space/PROJECTS/Atelier_Genie_Logiciel_Project/school-transport/models/routeModel.js

const RouteModel = {
    async getAll(filters = {}) {
        let sql = `
            SELECT r.id, r.name, r.departure_time, r.active,
                         b.id AS bus_id, b.plate_number, b.driver_name,
                         s.id AS school_id, s.name AS school_name
            FROM routes r
            JOIN buses b ON r.bus_id = b.id
            JOIN schools s ON r.school_id = s.id
            WHERE r.active = 1
        `;
        const params = [];

        if (filters.school_id) {
            sql += ' AND r.school_id = ?';
            params.push(filters.school_id);
        }

        if (filters.bus_id) {
            sql += ' AND r.bus_id = ?';
            params.push(filters.bus_id);
        }

        sql += ' ORDER BY r.departure_time ASC';
        const [rows] = await db.query(sql, params);
        return rows;
    },

    async getById(id) {
        const [rows] = await db.query(
            `SELECT r.id, r.name, r.departure_time, r.active,
                            b.id AS bus_id, b.plate_number, b.driver_name,
                            s.id AS school_id, s.name AS school_name
             FROM routes r
             JOIN buses b ON r.bus_id = b.id
             JOIN schools s ON r.school_id = s.id
             WHERE r.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    async create(data) {
        const { name, school_id, bus_id, departure_time } = data;
        const [result] = await db.query(
            'INSERT INTO routes (name, school_id, bus_id, departure_time) VALUES (?, ?, ?, ?)',
            [name, school_id, bus_id, departure_time]
        );
        return this.getById(result.insertId);
    },

    async update(id, data) {
        const { name, school_id, bus_id, departure_time, active } = data;
        await db.query(
            'UPDATE routes SET name = ?, school_id = ?, bus_id = ?, departure_time = ?, active = ? WHERE id = ?',
            [name, school_id, bus_id, departure_time, active, id]
        );
        return this.getById(id);
    },

    async delete(id) {
        await db.query('UPDATE routes SET active = 0 WHERE id = ?', [id]);
        return true;
    },

    async getRouteStops(routeId) {
        const [stops] = await db.query(
            `SELECT DISTINCT st.id, st.name, st.area
             FROM stops st
             JOIN students stud ON stud.stop_id = st.id
             JOIN routes r ON r.school_id = stud.school_id
             WHERE r.id = ?`,
            [routeId]
        );
        return stops;
    }
};

module.exports = RouteModel;