const db = require('../config/database');
const bcrypt = require('bcrypt');

const UserModel = {
    async findByEmail(email) {
        const [rows] = await db.query(
            'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    },

    async findById(id) {
        const [rows] = await db.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    // expects `data.password` (plain text) rather than a hash
    async create(data) {
        const { name, email, password, role } = data;
        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, password_hash, role]
        );
        return { id: result.insertId, name, email, role, created_at: new Date() };
    },

    // partial update; if `data.password` provided it will be hashed too
    async update(id, data) {
        const { name, email, role, password } = data;
        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            await db.query(
                'UPDATE users SET name = ?, email = ?, role = ?, password_hash = ? WHERE id = ?',
                [name, email, role, password_hash, id]
            );
        } else {
            await db.query(
                'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
                [name, email, role, id]
            );
        }
        return { id, name, email, role };
    },

    async findAll() {
        const [rows] = await db.query(
            'SELECT id, name, email, role, created_at FROM users'
        );
        return rows;
    },

    async deleteById(id) {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
};

module.exports = UserModel;