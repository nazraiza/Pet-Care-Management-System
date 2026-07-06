import express from "express";
import adminAuth from "../middleware/adminAuthMiddleware.js";
import {
  getRegistrationsPerEvent,
  getRevenuePerEvent,
  getRegistrationTrends,
  getEventStatusBreakdown,
  getRegistrationsByLocation,
  getRefundedRegistrations,
  getAppointmentsReport,
} from "../controllers/reportController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// Get total registrations per event (requires auth, admin)
router.get("/registrations-per-event",  getRegistrationsPerEvent);

// Get revenue per event (requires auth, admin)
router.get("/revenue-per-event", getRevenuePerEvent);

// Get registration trends over time (requires auth, admin)
router.get("/registration-trends",  getRegistrationTrends);

// Get event status breakdown (requires auth, admin)
router.get("/event-status-breakdown",  getEventStatusBreakdown);

// Get registrations by location (requires auth, admin)
router.get("/registrations-by-location", getRegistrationsByLocation);

// Get refunded registrations (requires auth, admin)
router.get("/refunded-registrations", getRefundedRegistrations);

// Get appointments report (weekly | monthly | yearly) - admin only
router.get("/appointments-report", adminAuth, getAppointmentsReport);

export default router;