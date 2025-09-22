// backend/routes/patientRoutes.js

const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');

// All patient routes require authentication
router.use(authMiddleware);

// GET /api/protected/patients - Get all patients
router.get('/', patientController.getPatients);

// GET /api/protected/patients/:id - Get single patient
router.get('/:id', patientController.getPatient);

// POST /api/protected/patients - Create new patient
router.post('/', patientController.createPatient);

// PUT /api/protected/patients/:id - Update patient
router.put('/:id', patientController.updatePatient);

// DELETE /api/protected/patients/:id - Delete patient
router.delete('/:id', patientController.deletePatient);

module.exports = router;
