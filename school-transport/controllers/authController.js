const UserModel = require('../models/userModel');
const ParentModel = require('../models/parentModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// filepath: /home/ghost/Projects Space/PROJECTS/Atelier_Genie_Logiciel_Project/school-transport/controllers/authController.js

exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }

        const user = await UserModel.findByEmail(email);
        
        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }
        
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        res.json({ token, role: user.role, name: user.name });
    } catch (err) {
        console.error('Login admin error:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.loginParent = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }

        const parent = await ParentModel.findByEmail(email);
        
        if (!parent || !await bcrypt.compare(password, parent.password_hash)) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }
        
        const token = jwt.sign(
            { id: parent.id, type: 'PARENT' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        res.json({ token, type: 'PARENT', name: parent.fullname });
    } catch (err) {
        console.error('Login parent error:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.logout = (req, res) => {
    res.json({ message: 'Déconnexion réussie' });
};