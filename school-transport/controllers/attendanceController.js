const AttendanceModel = require('../models/attendanceModel');

exports.saveAttendances = async (req, res) => {
    try {
        const tripDayId = req.params.trip_day_id;
        const list = req.body.list || [];
        await AttendanceModel.upsertList(tripDayId, list);
        res.json({ message: 'Présences enregistrées', count: list.length });
    } catch (err) {
        res.status(500).json({ message: 'Erreur enregistrement' });
    }
};

exports.getAttendances = async (req, res) => {
    try {
        const { date, route_id } = req.query;
        const attendances = await AttendanceModel.getByDateAndRoute(date, route_id);
        res.json(attendances);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// const pool = require('../config/database');

// exports.recordAttendance = async (req, res) => {
//     try {
//         const { trip_day_id } = req.params;
//         const { list } = req.body;

//         if (!list || !Array.isArray(list) || list.length === 0) {
//             return res.status(400).json({ error: 'Invalid or empty attendance list' });
//         }

//         for (const line of list) {
//             const { student_id, present } = line;

//             if (!student_id) {
//                 return res.status(400).json({ error: 'Missing student_id in attendance record' });
//             }

//             await pool.query(
//                 `INSERT INTO attendances (trip_day_id, student_id, present)
//                  VALUES (?, ?, ?)
//                  ON DUPLICATE KEY UPDATE present = VALUES(present)`,
//                 [trip_day_id, student_id, present ? 1 : 0]
//             );
//         }

//         res.status(200).json({ success: true, message: 'Attendance recorded successfully' });
//     } catch (error) {
//         console.error('Error recording attendance:', error);
//         res.status(500).json({ error: 'Failed to record attendance' });
//     }
// };