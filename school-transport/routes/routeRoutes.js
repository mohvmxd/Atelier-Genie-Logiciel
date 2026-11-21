const express = require('express');
const db = require('../config/database');

// filepath: /home/ghost/Projects Space/ESEP/Atelier_Genie_Logiciel/school-transport/routes/routeRoutes.js
const router = express.Router();

// GET /api/buses - Retrieve all buses
router.get('/buses', async (req, res) => {
    try {
        const query = 'SELECT * FROM buses';
        const [buses] = await db.query(query);
        res.json(buses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/buses - Create a new bus
router.post('/buses', async (req, res) => {
    try {
        const { plate_number, capacity, driver_name } = req.body;
        
        if (!plate_number || !capacity) {
            return res.status(400).json({ error: 'plate_number and capacity are required' });
        }

        const query = 'INSERT INTO buses (plate_number, capacity, driver_name, active) VALUES (?, ?, ?, 1)';
        const [result] = await db.query(query, [plate_number, capacity, driver_name || null]);
        
        res.status(201).json({ id: result.insertId, plate_number, capacity, driver_name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/routes - Retrieve all routes with related data
router.get('/routes', async (req, res) => {
    try {
        const query = `
            SELECT r.id, r.name, r.departure_time, r.active,
                         s.id as school_id, s.name as school_name,
                         b.id as bus_id, b.plate_number
            FROM routes r
            JOIN schools s ON r.school_id = s.id
            JOIN buses b ON r.bus_id = b.id
            WHERE r.active = 1
        `;
        const [routes] = await db.query(query);
        res.json(routes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/routes - Create a new route
router.post('/routes', async (req, res) => {
    try {
        const { name, school_id, bus_id, departure_time } = req.body;
        
        if (!name || !school_id || !bus_id || !departure_time) {
            return res.status(400).json({ error: 'name, school_id, bus_id, and departure_time are required' });
        }

        const query = 'INSERT INTO routes (name, school_id, bus_id, departure_time, active) VALUES (?, ?, ?, ?, 1)';
        const [result] = await db.query(query, [name, school_id, bus_id, departure_time]);
        
        res.status(201).json({ id: result.insertId, name, school_id, bus_id, departure_time });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;