const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const planningRoutes = require('./routes/planningRoutes');
const routeRoutes = require('./routes/routeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const parentRoutes = require('./routes/parentRoutes');
const { authenticate } = require('./middleware/auth');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Root route - redirect to login
app.get('/', (req, res) => {
    res.redirect('./html/login.html');
});

// Dashboard route
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/dashboard.html'));
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', authenticate, studentRoutes);
app.use('/api/attendance', authenticate, attendanceRoutes);
app.use('/api/planning', authenticate, planningRoutes);
app.use('/api/routes', authenticate, routeRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/parent', authenticate, parentRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint introuvable' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
});

// Start server
const PORT = process.env.PORT || 3648;
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
    console.log(`Accédez à http://localhost:${PORT}/ pour accéder à l'application`);
});