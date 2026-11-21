const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// administrator login
router.post('/login-admin', authController.loginAdmin);
// parent login
router.post('/login-parent', authController.loginParent);
// optional logout endpoint
router.post('/logout', authenticate, authController.logout);

module.exports = router;