const express = require('express');
const db = require('../config/database');

const router = express.Router();

// POST /api/trip-days/generate?date=YYYY-MM-DD
router.post('/trip-days/generate', async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Date parameter required' });
    }

    try {
        const [activeRoutes] = await db.query(
            'SELECT id FROM routes WHERE active = 1'
        );

        const tripDays = activeRoutes.map(route => [route.id, date, 'NON_DEMARREE']);

        await db.query(
            'INSERT INTO trip_days (route_id, date, status) VALUES ?',
            [tripDays]
        );

        res.json({ message: `Generated ${tripDays.length} trip days` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/trip-days?date=YYYY-MM-DD
router.get('/trip-days', async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Date parameter required' });
    }

    try {
        const [tripDays] = await db.query(
            `SELECT td.id, td.route_id, td.date, td.status, r.name as route_name, b.plate_number, s.name as school_name
             FROM trip_days td
             JOIN routes r ON td.route_id = r.id
             JOIN buses b ON r.bus_id = b.id
             JOIN schools s ON r.school_id = s.id
             WHERE td.date = ?`,
            [date]
        );

        res.json(tripDays);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/attendances/:trip_day_id
router.post('/attendances/:trip_day_id', async (req, res) => {
    const { trip_day_id } = req.params;
    const attendanceData = req.body;

    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
        return res.status(400).json({ error: 'Attendance array required' });
    }

    try {
        const values = attendanceData.map(item => [
            trip_day_id,
            item.student_id,
            item.present ? 1 : 0
        ]);

        await db.query(
            'INSERT INTO attendances (trip_day_id, student_id, present) VALUES ? ON DUPLICATE KEY UPDATE present = VALUES(present)',
            [values]
        );

        res.json({ message: `Updated ${values.length} attendance records` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/attendances?date=YYYY-MM-DD&route_id=...
router.get('/attendances', async (req, res) => {
    const { date, route_id } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Date parameter required' });
    }

    try {
        let query = `
            SELECT a.id, a.student_id, st.fullname, a.present, td.date, r.name as route_name
            FROM attendances a
            JOIN trip_days td ON a.trip_day_id = td.id
            JOIN routes r ON td.route_id = r.id
            JOIN students st ON a.student_id = st.id
            WHERE td.date = ?
        `;

        const params = [date];

        if (route_id) {
            query += ' AND r.id = ?';
            params.push(route_id);
        }

        const [attendances] = await db.query(query, params);
        res.json(attendances);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;