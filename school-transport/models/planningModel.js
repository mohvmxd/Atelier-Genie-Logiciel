const db = require('../config/database');

// filepath: /home/ghost/Projects Space/PROJECTS/Atelier_Genie_Logiciel_Project/school-transport/models/planningModel.js

const PlanningModel = {
    async runGreedy(date, userId) {
        // Algorithme glouton simple
        const [students] = await db.query(`
            SELECT id, school_id FROM students WHERE active = 1
            ORDER BY school_id
        `);
        
        const [buses] = await db.query(`
            SELECT id, capacity FROM buses WHERE active = 1
        `);

        // Grouper par école
        const groups = {};
        for (const student of students) {
            if (!groups[student.school_id]) groups[student.school_id] = [];
            groups[student.school_id].push(student.id);
        }

        // Initialiser les bus
        const busLoads = buses.map(bus => ({
            id: bus.id,
            capacity: bus.capacity,
            currentLoad: 0,
            students: []
        }));

        // Algorithme glouton
        for (const schoolId in groups) {
            for (const studentId of groups[schoolId]) {
                let bestBus = null;
                let bestLoad = Infinity;
                
                for (const bus of busLoads) {
                    if (bus.currentLoad < bus.capacity && bus.currentLoad < bestLoad) {
                        bestBus = bus;
                        bestLoad = bus.currentLoad;
                    }
                }
                
                if (bestBus) {
                    bestBus.students.push(studentId);
                    bestBus.currentLoad++;
                }
            }
        }

        // Sauvegarder en base
        const [result] = await db.query(
            'INSERT INTO planning_runs (date, created_by) VALUES (?, ?)',
            [date, userId]
        );
        const planningRunId = result.insertId;

        for (const bus of busLoads) {
            for (const studentId of bus.students) {
                await db.query(
                    'INSERT INTO bus_assignments (planning_run_id, bus_id, student_id) VALUES (?, ?, ?)',
                    [planningRunId, bus.id, studentId]
                );
            }
        }

        return {
            id: planningRunId,
            date,
            buses: busLoads
        };
    },

    async getById(id) {
        const [rows] = await db.query(`
            SELECT ba.bus_id, ba.student_id, s.fullname, b.plate_number, b.capacity
            FROM bus_assignments ba
            JOIN students s ON ba.student_id = s.id
            JOIN buses b ON ba.bus_id = b.id
            JOIN planning_runs pr ON ba.planning_run_id = pr.id
            WHERE pr.id = ?
        `, [id]);
        return rows;
    },

    async getAll(limit = 10, offset = 0) {
        const [rows] = await db.query(`
            SELECT id, date, created_by, created_at
            FROM planning_runs
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        return rows;
    },

    async delete(id) {
        await db.query('DELETE FROM bus_assignments WHERE planning_run_id = ?', [id]);
        const [result] = await db.query('DELETE FROM planning_runs WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
};

module.exports = PlanningModel;