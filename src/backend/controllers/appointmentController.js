// backend/controllers/appointmentController.js

const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const logger = require('../utils/logger');

// Get all appointments (with optional filtering)
const getAppointments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      patientId,
      doctorId,
      status,
      dateFrom,
      dateTo,
      sortBy = 'appointmentDate',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    let filter = {};

    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;

    if (dateFrom || dateTo) {
      filter.appointmentDate = {};
      if (dateFrom) filter.appointmentDate.$gte = new Date(dateFrom);
      if (dateTo) filter.appointmentDate.$lte = new Date(dateTo);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalAppointments: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    logger.error(`Get appointments error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointments'
    });
  }
};

// Get single appointment by ID
const getAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      appointment
    });
  } catch (err) {
    logger.error(`Get appointment error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointment'
    });
  }
};

// Create new appointment
const createAppointment = async (req, res) => {
  try {
    // Verify patient exists
    const patient = await Patient.findById(req.body.patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const appointmentData = {
      ...req.body,
      createdBy: req.user.userId
    };

    const appointment = new Appointment(appointmentData);
    await appointment.save();

    await appointment.populate('patientId', 'firstName lastName email');
    await appointment.populate('doctorId', 'firstName lastName email');
    await appointment.populate('createdBy', 'firstName lastName email');

    logger.info(`Appointment created: ${appointment._id} by user ${req.user.userId}`);

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment
    });
  } catch (err) {
    logger.error(`Create appointment error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while creating appointment'
    });
  }
};

// Update appointment
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user.userId
    };

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    logger.info(`Appointment updated: ${id} by user ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment
    });
  } catch (err) {
    logger.error(`Update appointment error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while updating appointment'
    });
  }
};

// Update appointment status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updateData = {
      status,
      updatedBy: req.user.userId
    };

    if (notes) updateData.notes = notes;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    logger.info(`Appointment status updated: ${id} to ${status} by user ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (err) {
    logger.error(`Update appointment status error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while updating appointment status'
    });
  }
};

// Delete appointment
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    logger.info(`Appointment deleted: ${id} by user ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (err) {
    logger.error(`Delete appointment error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting appointment'
    });
  }
};

module.exports = {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment
};
