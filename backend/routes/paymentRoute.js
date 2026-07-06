import express from "express";

import {
  initiatePayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  getInvoice,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/init", initiatePayment);

router.get("/success/:appointmentId", paymentSuccess);
router.post("/success/:appointmentId", paymentSuccess);

router.get("/fail/:appointmentId", paymentFail);
router.post("/fail/:appointmentId", paymentFail);

router.get("/cancel/:appointmentId", paymentCancel);
router.post("/cancel/:appointmentId", paymentCancel);

router.get("/invoice/:appointmentId", getInvoice);

export default router;