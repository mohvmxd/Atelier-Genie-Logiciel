const StudentModel = require('../models/studentModel');

exports.listStudents = async (req, res) => {
    try {
        const filters = {
            school_id: req.query.school_id,
            stop_id: req.query.stop_id,
            active: req.query.active !== undefined ? req.query.active === '1' : undefined
        };
        const students = await StudentModel.getAll(filters);
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.createStudent = async (req, res) => {
    try {
        const { fullname, school_id, stop_id } = req.body;
        
        if (!fullname || !school_id) {
            return res.status(400).json({ message: 'fullname et school_id sont requis' });
        }

        const student = await StudentModel.create({ fullname, school_id, stop_id });
        res.status(201).json(student);
    } catch (err) {
        res.status(500).json({ message: 'Erreur création élève' });
    }
};

exports.getStudent = async (req, res) => {
    try {
        const student = await StudentModel.getById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Élève non trouvé' });
        }
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const student = await StudentModel.update(req.params.id, req.body);
        if (!student) {
            return res.status(404).json({ message: 'Élève non trouvé' });
        }
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: 'Erreur mise à jour' });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        await StudentModel.softDelete(req.params.id);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Erreur suppression' });
    }
};