const express = require('express');
const db = require('../config/database');

const router = express.Router();

// GET /api/students with filters
router.get('/', async (req, res) => {
    try {
        const { school, stop, active } = req.query;
        let query = 'SELECT * FROM students WHERE 1=1';
        const params = [];

        if (school) {
            query += ' AND school = ?';
            params.push(school);
        }
        if (stop) {
            query += ' AND stop = ?';
            params.push(stop);
        }
        if (active !== undefined) {
            query += ' AND active = ?';
            params.push(active === 'true' ? 1 : 0);
        }

        const [rows] = await db.query(query, params);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/students
router.post('/', async (req, res) => {
    try {
        const { name, email, school, stop, active } = req.body;
        const query = 'INSERT INTO students (name, email, school, stop, active) VALUES (?, ?, ?, ?, ?)';
        
        const [result] = await db.query(query, [name, email, school, stop, active || 1]);

        res.status(201).json({ id: result.insertId, message: 'Student created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/students/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, school, stop, active } = req.body;
        const query = 'UPDATE students SET name = ?, email = ?, school = ?, stop = ?, active = ? WHERE id = ?';
        
        await db.query(query, [name, email, school, stop, active, id]);

        res.json({ message: 'Student updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/students/:id (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'UPDATE students SET active = 0 WHERE id = ?';
        
        await db.query(query, [id]);

        res.json({ message: 'Student deleted (soft delete)' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;