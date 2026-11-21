const StudentModel = require('../models/studentModel');
const AttendanceModel = require('../models/attendanceModel');
const TripDayModel = require('../models/tripDayModel');

exports.getSummary = async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        
        const totalInscrits = await StudentModel.countActive();
        const totalPresents = await AttendanceModel.countPresents(date);
        const busesEnService = await TripDayModel.countActiveBuses(date);
        
        const taux = totalInscrits > 0 ? Math.round((totalPresents / totalInscrits) * 100) : 0;
        
        res.json({
            date,
            total_inscrits: totalInscrits,
            total_presents: totalPresents,
            buses_en_service: busesEnService,
            taux_presence: taux
        });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getSummary };

// const pool = require('../config/database');

// // Middleware to check role
// const checkDashboardAccess = (req, res, next) => {
//     const allowedRoles = ['ONG', 'MAIRIE'];
//     if (!allowedRoles.includes(req.user.role)) {
//         return res.status(403).json({ error: 'Access denied. Only ONG and MAIRIE can access dashboard.' });
//     }
//     next();
// };

// exports.getSummary = async (req, res) => {
//     try {
//         const { date } = req.query;

//         if (!date) {
//             return res.status(400).json({ error: 'Date parameter is required' });
//         }

//         // Validate date format (YYYY-MM-DD)
//         if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
//             return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
//         }

//         // Total registered students
//         const [totalStudents] = await pool.query(
//             'SELECT COUNT(*) as total_inscrits FROM students WHERE active = 1'
//         );

//         // Total present students
//         const [presentStudents] = await pool.query(
//             `SELECT COUNT(DISTINCT a.student_id) as total_presents 
//              FROM attendances a 
//              JOIN trip_days t ON a.trip_day_id = t.id 
//              WHERE t.date = ? AND a.present = 1`,
//             [date]
//         );

//         // Buses in service
//         const [busesInService] = await pool.query(
//             `SELECT COUNT(DISTINCT r.bus_id) as buses_en_service 
//              FROM trip_days t 
//              JOIN routes r ON t.route_id = r.id 
//              WHERE t.date = ? AND t.status IN ('EN_COURS', 'TERMINE')`,
//             [date]
//         );

//         const totalInscrits = totalStudents[0].total_inscrits;
//         const totalPresents = presentStudents[0].total_presents;
//         const busesCount = busesInService[0].buses_en_service;
//         const taux = totalInscrits > 0 ? (totalPresents / totalInscrits) * 100 : 0;

//         res.json({
//             total_inscrits: totalInscrits,
//             total_presents: totalPresents,
//             buses_en_service: busesCount,
//             taux: parseFloat(taux.toFixed(2))
//         });
//     } catch (error) {
//         console.error('Dashboard summary error:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };

// module.exports = { getSummary, checkDashboardAccess };