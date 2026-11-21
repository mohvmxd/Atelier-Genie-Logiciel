const db = require('../config/database');

// filepath: /home/ghost/Projects Space/PROJECTS/Atelier_Genie_Logiciel_Project/school-transport/models/studentModel.js

const StudentModel = {
    async getAll(filters = {}) {
        let sql = `
            SELECT s.id, s.fullname, s.active,
                         sc.name AS school_name, st.name AS stop_name,
                         s.school_id, s.stop_id
            FROM students s
            LEFT JOIN schools sc ON s.school_id = sc.id
            LEFT JOIN stops st ON s.stop_id = st.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.school_id) {
            sql += ' AND s.school_id = ?';
            params.push(filters.school_id);
        }
        if (filters.active !== undefined) {
            sql += ' AND s.active = ?';
            params.push(filters.active ? 1 : 0);
        }
        if (filters.stop_id) {
            sql += ' AND s.stop_id = ?';
            params.push(filters.stop_id);
        }

        const [rows] = await db.query(sql, params);
        return rows;
    },

    async getById(id) {
        const [rows] = await db.query(
            `SELECT s.id, s.fullname, s.active, s.school_id, s.stop_id,
                            sc.name AS school_name, st.name AS stop_name
             FROM students s
             LEFT JOIN schools sc ON s.school_id = sc.id
             LEFT JOIN stops st ON s.stop_id = st.id
             WHERE s.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    async countActive() {
        const [rows] = await db.query(
            'SELECT COUNT(*) as count FROM students WHERE active = 1'
        );
        return rows[0].count;
    },

    async countBySchool(schoolId) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as count FROM students WHERE school_id = ? AND active = 1',
            [schoolId]
        );
        return rows[0].count;
    },

    async create(data) {
        const { fullname, school_id, stop_id } = data;
        const [result] = await db.query(
            'INSERT INTO students (fullname, school_id, stop_id, active) VALUES (?, ?, ?, 1)',
            [fullname, school_id, stop_id || null]
        );
        return { id: result.insertId, ...data, active: 1 };
    },

    async update(id, data) {
        const fields = [];
        const values = [];

        if (data.fullname !== undefined) {
            fields.push('fullname = ?');
            values.push(data.fullname);
        }
        if (data.school_id !== undefined) {
            fields.push('school_id = ?');
            values.push(data.school_id);
        }
        if (data.stop_id !== undefined) {
            fields.push('stop_id = ?');
            values.push(data.stop_id || null);
        }
        if (data.active !== undefined) {
            fields.push('active = ?');
            values.push(data.active ? 1 : 0);
        }

        if (fields.length === 0) return { id, ...data };

        values.push(id);
        const sql = `UPDATE students SET ${fields.join(', ')} WHERE id = ?`;

        await db.query(sql, values);
        return await this.getById(id);
    },

    async softDelete(id) {
        await db.query('UPDATE students SET active = 0 WHERE id = ?', [id]);
    },

    async getByParentId(parentId) {
        const [rows] = await db.query(
            `SELECT s.id, s.fullname, s.active, s.school_id, s.stop_id,
                            sc.name AS school_name, st.name AS stop_name
             FROM students s
             LEFT JOIN schools sc ON s.school_id = sc.id
             LEFT JOIN stops st ON s.stop_id = st.id
             JOIN parent_students ps ON s.id = ps.student_id
             WHERE ps.parent_id = ? AND s.active = 1`,
            [parentId]
        );
        return rows;
    }
};

module.exports = StudentModel;