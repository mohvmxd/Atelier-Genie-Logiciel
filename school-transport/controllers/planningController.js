const PlanningModel = require('../models/planningModel');

exports.runPlanning = async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const planning = await PlanningModel.runGreedy(date, req.user.id);
        res.json(planning);
    } catch (err) {
        res.status(500).json({ message: 'Erreur planification' });
    }
};

exports.getPlanning = async (req, res) => {
    try {
        const { id } = req.params;
        const planning = await PlanningModel.getById(id);
        res.json(planning);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// const db = require('../config/database');

// // Greedy planning algorithm for bus assignments
// exports.createPlanningRun = async (req, res) => {
//     try {
//         const { date } = req.query;
//         const userId = req.user?.id;

//         if (!date) {
//             return res.status(400).json({ error: 'Date parameter is required' });
//         }

//         // 1. Get active buses with capacity
//         const [buses] = await db.promise().query(
//             'SELECT id, plate_number, capacity FROM buses WHERE active = 1'
//         );

//         if (buses.length === 0) {
//             return res.status(400).json({ error: 'No active buses available' });
//         }

//         // 2. Get active students with schools and stops
//         const [students] = await db.promise().query(`
//             SELECT s.id, s.fullname, s.school_id, s.stop_id, 
//                          sc.name as school_name, st.area
//             FROM students s
//             JOIN schools sc ON s.school_id = sc.id
//             LEFT JOIN stops st ON s.stop_id = st.id
//             WHERE s.active = 1
//         `);

//         if (students.length === 0) {
//             return res.status(400).json({ error: 'No active students found' });
//         }

//         // 3. Group by school_id (and area if present)
//         const grouped = {};
//         students.forEach(student => {
//             const key = `${student.school_id}-${student.area || 'default'}`;
//             if (!grouped[key]) {
//                 grouped[key] = { school_id: student.school_id, area: student.area, students: [] };
//             }
//             grouped[key].students.push(student);
//         });

//         // 4. Sort groups by size (descending)
//         const sortedGroups = Object.values(grouped)
//             .sort((a, b) => b.students.length - a.students.length);

//         // Track bus loads
//         const busLoads = {};
//         buses.forEach(bus => {
//             busLoads[bus.id] = 0;
//         });

//         // 5. Greedy assignment
//         const assignments = [];
//         for (const group of sortedGroups) {
//             for (const student of group.students) {
//                 // Find bus with smallest load that still has capacity
//                 let bestBus = null;
//                 let minLoad = Infinity;

//                 for (const bus of buses) {
//                     if (busLoads[bus.id] < bus.capacity && busLoads[bus.id] < minLoad) {
//                         bestBus = bus;
//                         minLoad = busLoads[bus.id];
//                     }
//                 }

//                 if (bestBus) {
//                     assignments.push({
//                         bus_id: bestBus.id,
//                         student_id: student.id,
//                         bus_plate: bestBus.plate_number,
//                         student_name: student.fullname
//                     });
//                     busLoads[bestBus.id]++;
//                 }
//             }
//         }

//         // 6. Create planning_runs entry
//         const [planningResult] = await db.promise().query(
//             'INSERT INTO planning_runs (date, created_by) VALUES (?, ?)',
//             [date, userId || null]
//         );
//         const planningRunId = planningResult.insertId;

//         // 7. Insert bus_assignments
//         for (const assignment of assignments) {
//             await db.promise().query(
//                 'INSERT INTO bus_assignments (planning_run_id, bus_id, student_id) VALUES (?, ?, ?)',
//                 [planningRunId, assignment.bus_id, assignment.student_id]
//             );
//         }

//         // 8. Return planning with bus + student lists
//         const bussedStudents = {};
//         assignments.forEach(a => {
//             if (!bussedStudents[a.bus_id]) {
//                 bussedStudents[a.bus_id] = { plate: a.bus_plate, students: [] };
//             }
//             bussedStudents[a.bus_id].students.push(a.student_name);
//         });

//         res.status(201).json({
//             planning_run_id: planningRunId,
//             date,
//             total_students: assignments.length,
//             buses: bussedStudents
//         });

//     } catch (error) {
//         console.error('Planning error:', error);
//         res.status(500).json({ error: 'Planning creation failed' });
//     }
// };