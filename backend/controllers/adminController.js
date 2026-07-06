// backend/controllers/adminController.js
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import MedicalReport from '../models/MedicalReport.js';
import Pet from '../models/Pet.js'; // Needed for vet-specific queries

// --------------------
// Register Admin
// --------------------
export const registerAdmin = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    const admin = new Admin({ name, email, password, role });
    await admin.save();

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering admin', error: error.message });
  }
};

// --------------------
// Admin Login
// --------------------
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = jwt.sign(
      { adminId: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------
// Get Admin Profile
// --------------------
export const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    res.status(200).json({
      success: true,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Error fetching admin details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// --------------------
// Admin View — Fetch All Reports
// --------------------
// --------------------
// Admin View — Fetch All Reports
// --------------------
export const getAllMedicalReports = async (req, res) => {
  try {
    const reports = await MedicalReport.find();

    res.status(200).json({
      success: true,
      reports,
    });

  } catch (error) {
    console.error('Error fetching medical reports:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// --------------------
// Vet View — Fetch Only Their Reports
// --------------------
export const getVetReports = async (req, res) => {
  try {
    const vetId = req.userId; // Assume vetAuth middleware sets this from JWT

    // Fetch only reports created by this vet
    const reports = await MedicalReport.findByVet(vetId);

    if (!reports || reports.length === 0) {
      return res.status(404).json({ success: false, message: 'No reports found for this vet' });
    }

    res.status(200).json({ success: true, reports });
  } catch (error) {
    console.error('Error fetching vet reports:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};