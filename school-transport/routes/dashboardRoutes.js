const express = require('express');
const db = require('../config/database');
// const { authenticate, authorize } = require('../middleware/auth');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/summary?date=YYYY-MM-DD
router.get('/summary', authenticate, authorize(['ONG', 'MAIRIE']), async (req, res) => {
    try {
        const { date } = req.query;

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }

        // Nombre d'élèves transportés pour cette date
        const studentsTransported = await db.query(
            `SELECT COUNT(DISTINCT ba.student_id) as count
             FROM bus_assignments ba
             JOIN planning_runs pr ON ba.planning_run_id = pr.id
             WHERE pr.date = ?`,
            [date]
        );

        // Nombre de bus en service pour cette date
        const busesInService = await db.query(
            `SELECT COUNT(DISTINCT ba.bus_id) as count
             FROM bus_assignments ba
             JOIN planning_runs pr ON ba.planning_run_id = pr.id
             WHERE pr.date = ?`,
            [date]
        );

        // Taux de présence
        const attendance = await db.query(
            `SELECT 
                 COUNT(CASE WHEN a.present = 1 THEN 1 END) as present,
                 COUNT(*) as total
             FROM attendances a
             JOIN trip_days td ON a.trip_day_id = td.id
             WHERE td.date = ?`,
            [date]
        );

        const attendanceRate = attendance[0].total > 0 
            ? ((attendance[0].present / attendance[0].total) * 100).toFixed(2)
            : 0;

        res.json({
            date,
            studentsTransported: studentsTransported[0].count,
            busesInService: busesInService[0].count,
            attendanceRate: parseFloat(attendanceRate),
            totalStudentsExpected: attendance[0].total
        });

    } catch (error) {
        console.error('Dashboard summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;