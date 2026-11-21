const express = require('express');
const db = require('../config/database');

// filepath: /home/ghost/Projects Space/ESEP/Atelier_Genie_Logiciel/school-transport/routes/planningRoutes.js
const router = express.Router();

// POST /api/planning/run?date=YYYY-MM-DD
router.post('/run', async (req, res) => {
    try {
        const { date } = req.query;
        const userId = req.user.id; // Assuming auth middleware sets this

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }

        const connection = await db.getConnection();

        // Insert planning run
        const [result] = await connection.execute(
            'INSERT INTO planning_runs (date, created_by) VALUES (?, ?)',
            [date, userId]
        );

        const planningRunId = result.insertId;

        // Get all active students with their stops and schools
        const [students] = await connection.execute(`
            SELECT s.id, s.fullname, s.school_id, s.stop_id, sc.name as school_name, st.name as stop_name
            FROM students s
            JOIN schools sc ON s.school_id = sc.id
            LEFT JOIN stops st ON s.stop_id = st.id
            WHERE s.active = 1
        `);

        // Get active buses with capacity
        const [buses] = await connection.execute(`
            SELECT id, plate_number, capacity, driver_name
            FROM buses
            WHERE active = 1
            ORDER BY capacity DESC
        `);

        // Simple assignment: distribute students to buses by capacity
        let busIndex = 0;
        let busCurrentLoad = 0;

        for (const student of students) {
            if (busIndex >= buses.length) break;

            const currentBus = buses[busIndex];

            if (busCurrentLoad >= currentBus.capacity) {
                busIndex++;
                busCurrentLoad = 0;
                if (busIndex >= buses.length) break;
            }

            await connection.execute(
                'INSERT INTO bus_assignments (planning_run_id, bus_id, student_id) VALUES (?, ?, ?)',
                [planningRunId, currentBus.id, student.id]
            );

            busCurrentLoad++;
        }

        connection.release();

        res.status(201).json({
            id: planningRunId,
            date,
            students_assigned: students.length,
            buses_used: Math.min(busIndex + 1, buses.length)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create planning run' });
    }
});

// GET /api/planning/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const connection = await db.getConnection();

        // Get planning run details
        const [planningRun] = await connection.execute(`
            SELECT pr.id, pr.date, u.name as created_by
            FROM planning_runs pr
            LEFT JOIN users u ON pr.created_by = u.id
            WHERE pr.id = ?
        `, [id]);

        if (planningRun.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Planning run not found' });
        }

        // Get bus assignments with student details
        const [assignments] = await connection.execute(`
            SELECT 
                ba.id,
                b.id as bus_id,
                b.plate_number,
                b.capacity,
                b.driver_name,
                s.id as student_id,
                s.fullname as student_name,
                sc.name as school_name,
                st.name as stop_name
            FROM bus_assignments ba
            JOIN buses b ON ba.bus_id = b.id
            JOIN students s ON ba.student_id = s.id
            JOIN schools sc ON s.school_id = sc.id
            LEFT JOIN stops st ON s.stop_id = st.id
            WHERE ba.planning_run_id = ?
            ORDER BY b.id, s.fullname
        `, [id]);

        // Group by bus
        const busMap = {};
        assignments.forEach(assignment => {
            if (!busMap[assignment.bus_id]) {
                busMap[assignment.bus_id] = {
                    bus_id: assignment.bus_id,
                    plate_number: assignment.plate_number,
                    capacity: assignment.capacity,
                    driver_name: assignment.driver_name,
                    students: []
                };
            }
            busMap[assignment.bus_id].students.push({
                student_id: assignment.student_id,
                student_name: assignment.student_name,
                school_name: assignment.school_name,
                stop_name: assignment.stop_name
            });
        });

        connection.release();

        res.json({
            planning_run: planningRun[0],
            buses: Object.values(busMap)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch planning run' });
    }
});

module.exports = router;