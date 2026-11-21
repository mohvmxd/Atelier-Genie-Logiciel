const express = require('express');
const parentController = require('../controllers/parentController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get parent's students
router.get('/my-students', authenticate, parentController.getMyStudents);

// Get student's trip history
router.get('/student-trips/:student_id', authenticate, parentController.getStudentTrips);

// Get student's attendance history
router.get('/student-attendance/:student_id', authenticate, parentController.getStudentAttendance);

// Get current user details
router.get('/current-user', authenticate, parentController.getCurrentUser);

module.exports = router;
