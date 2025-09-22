// backend/routes/appointmentRoutes.js

const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/authMiddleware');

// All appointment routes require authentication
router.use(authMiddleware);

// GET /api/protected/appointments - Get all appointments
router.get('/', appointmentController.getAppointments);

// GET /api/protected/appointments/:id - Get single appointment
router.get('/:id', appointmentController.getAppointment);

// POST /api/protected/appointments - Create new appointment
router.post('/', appointmentController.createAppointment);

// PUT /api/protected/appointments/:id - Update appointment
router.put('/:id', appointmentController.updateAppointment);

// PUT /api/protected/appointments/:id/status - Update appointment status
router.put('/:id/status', appointmentController.updateAppointmentStatus);

// DELETE /api/protected/appointments/:id - Delete appointment
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;
