const RouteModel = require('../models/routeModel');
const BusModel = require('../models/busModel');

exports.listRoutes = async (req, res) => {
    try {
        const routes = await RouteModel.getAll(req.query);
        res.json(routes);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.createRoute = async (req, res) => {
    try {
        const route = await RouteModel.create(req.body);
        res.status(201).json(route);
    } catch (err) {
        res.status(500).json({ message: 'Erreur création circuit' });
    }
};

exports.listBuses = async (req, res) => {
    try {
        const buses = await BusModel.getAll();
        res.json(buses);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.createBus = async (req, res) => {
    try {
        const bus = await BusModel.create(req.body);
        res.status(201).json(bus);
    } catch (err) {
        res.status(500).json({ message: 'Erreur création bus' });
    }
};

// const pool = require('../config/database');

// exports.getActiveRoutesAndCreateTripDays = async (req, res) => {
//     try {
//         const connection = await pool.getConnection();
        
//         // Get all active routes
//         const [routes] = await connection.query(
//             'SELECT id FROM routes WHERE active = 1'
//         );
        
//         const today = new Date().toISOString().split('T')[0];
        
//         // For each route, check if trip_day exists for today
//         for (const route of routes) {
//             const [existingTripDay] = await connection.query(
//                 'SELECT id FROM trip_days WHERE route_id = ? AND date = ?',
//                 [route.id, today]
//             );
            
//             // If no trip_day exists, create one
//             if (existingTripDay.length === 0) {
//                 await connection.query(
//                     'INSERT INTO trip_days (route_id, date, status) VALUES (?, ?, ?)',
//                     [route.id, today, 'NON_DEMARREE']
//                 );
//             }
//         }
        
//         connection.release();
        
//         res.status(200).json({
//             message: 'Active routes processed successfully',
//             routesCount: routes.length
//         });
//     } catch (error) {
//         console.error('Error processing routes:', error);
//         res.status(500).json({ error: 'Failed to process routes' });
//     }
// };