const db = require('../config/database');

// filepath: /home/ghost/Projects Space/PROJECTS/Atelier_Genie_Logiciel_Project/school-transport/models/busModel.js

const BusModel = {
    async getAll() {
        const [rows] = await db.query(`
            SELECT id, plate_number, capacity, driver_name, active
            FROM buses
            WHERE active = 1
            ORDER BY plate_number
        `);
        return rows;
    },

    async getById(id) {
        const [rows] = await db.query(
            'SELECT id, plate_number, capacity, driver_name, active FROM buses WHERE id = ? AND active = 1',
            [id]
        );
        return rows[0] || null;
    },

    async create(data) {
        const { plate_number, capacity, driver_name } = data;
        const [result] = await db.query(
            'INSERT INTO buses (plate_number, capacity, driver_name, active) VALUES (?, ?, ?, 1)',
            [plate_number, capacity, driver_name || null]
        );
        return { id: result.insertId, ...data, active: 1 };
    },

    async update(id, data) {
        const { plate_number, capacity, driver_name, active } = data;
        const [result] = await db.query(
            'UPDATE buses SET plate_number = ?, capacity = ?, driver_name = ?, active = ? WHERE id = ?',
            [plate_number, capacity, driver_name || null, active !== undefined ? active : 1, id]
        );
        return result.affectedRows > 0;
    },

    async delete(id) {
        const [result] = await db.query(
            'UPDATE buses SET active = 0 WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
};

module.exports = BusModel;