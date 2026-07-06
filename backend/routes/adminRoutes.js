import express from 'express';
import { login, getProfile, registerAdmin, getAllMedicalReports } from '../controllers/adminController.js';
import adminAuth from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerAdmin);
router.post('/login', login);

// Protected routes for profiles
router.get('/profile', adminAuth, getProfile);
router.get('/medical-reports', adminAuth, getAllMedicalReports);

export default router;
