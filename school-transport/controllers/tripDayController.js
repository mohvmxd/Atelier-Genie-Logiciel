const TripDayModel = require('../models/tripDayModel');

exports.generateTripDays = async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const tripDays = await TripDayModel.generateForDate(date);
        res.json({ message: 'Journées créées', count: tripDays.length, date });
    } catch (err) {
        res.status(500).json({ message: 'Erreur génération' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['NON_DEMARREE', 'EN_COURS', 'TERMINE'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }
        
        await TripDayModel.updateStatus(id, status);
        res.json({ message: `Statut mis à jour: ${status}` });
    } catch (err) {
        res.status(500).json({ message: 'Erreur mise à jour' });
    }
};

exports.getTripDaysByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const tripDays = await TripDayModel.getByDate(date);
        res.json(tripDays);
    } catch (err) {
        res.status(500).json({ message: 'Erreur récupération' });
    }
};

exports.getTripDayById = async (req, res) => {
    try {
        const { id } = req.params;
        const tripDay = await TripDayModel.getById(id);
        if (!tripDay) {
            return res.status(404).json({ message: 'Journée non trouvée' });
        }
        res.json(tripDay);
    } catch (err) {
        res.status(500).json({ message: 'Erreur récupération' });
    }
};