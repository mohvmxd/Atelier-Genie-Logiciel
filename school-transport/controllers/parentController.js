const ParentModel = require('../models/parentModel');

exports.getMyStudents = async (req, res) => {
    try {
        const parentId = req.user.id;
        const students = await ParentModel.getStudents(parentId);
        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.getStudentTrips = async (req, res) => {
    try {
        const { student_id } = req.params;
        const parentId = req.user.id;

        // Verify parent owns this student
        const isOwner = await ParentModel.isParentOfStudent(parentId, student_id);
        if (!isOwner) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const trips = await ParentModel.getTripHistory(student_id);
        res.json(trips);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.getStudentAttendance = async (req, res) => {
    try {
        const { student_id } = req.params;
        const parentId = req.user.id;

        const isOwner = await ParentModel.isParentOfStudent(parentId, student_id);
        if (!isOwner) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const attendance = await ParentModel.getStudentAttendance(student_id);
        res.json(attendance);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const parentId = req.user.id;
        const parentDetails = await ParentModel.findById(parentId);
        res.json(parentDetails);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};