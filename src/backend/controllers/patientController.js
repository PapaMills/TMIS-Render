// backend/controllers/patientController.js

const Patient = require('../models/Patient');
const logger = require('../utils/logger');

// Get all patients (with optional filtering)
const getPatients = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'lastName',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    let filter = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const patients = await Patient.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Patient.countDocuments(filter);

    res.json({
      success: true,
      patients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPatients: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    logger.error(`Get patients error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patients'
    });
  }
};

// Get single patient by ID
const getPatient = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      patient
    });
  } catch (err) {
    logger.error(`Get patient error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patient'
    });
  }
};

// Create new patient
const createPatient = async (req, res) => {
  try {
    const patientData = {
      ...req.body,
      createdBy: req.user.userId
    };

    const patient = new Patient(patientData);
    await patient.save();

    await patient.populate('createdBy', 'firstName lastName email');

    logger.info(`Patient created: ${patient._id} by user ${req.user.userId}`);

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      patient
    });
  } catch (err) {
    logger.error(`Create patient error: ${err.message}`);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating patient'
    });
  }
};

// Update patient
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user.userId
    };

    const patient = await Patient.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    logger.info(`Patient updated: ${id} by user ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Patient updated successfully',
      patient
    });
  } catch (err) {
    logger.error(`Update patient error: ${err.message}`);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating patient'
    });
  }
};

// Delete patient
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findByIdAndDelete(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    logger.info(`Patient deleted: ${id} by user ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (err) {
    logger.error(`Delete patient error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting patient'
    });
  }
};

module.exports = {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient
};
