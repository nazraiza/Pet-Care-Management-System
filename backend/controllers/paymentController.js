import SSLCommerzPayment from "sslcommerz-lts";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Pet from "../models/Pet.js";
import RefundRequest from "../models/AppointmentrefundRequestModel.js";
import axios from "axios";

const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = false; // false = sandbox

// Initialize Payment
export const initiatePayment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    // Find appointment
const appointment = await Appointment.findById(appointmentId).populate('petId');
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const tran_id = `PETCARE_${Date.now()}`;

    const data = {
      total_amount: appointment.appointmentFee,
      currency: "BDT",
      tran_id: tran_id,

      success_url: `http://localhost:5003/api/payment/success/${appointment._id}`,
      fail_url: `http://localhost:5003/api/payment/fail/${appointment._id}`,
      cancel_url: `http://localhost:5003/api/payment/cancel/${appointment._id}`,

      ipn_url: "http://localhost:5003/api/payment/ipn",

      shipping_method: "NO",
      product_name: appointment.appointmentType,
      product_category: "Pet Care",
      product_profile: "general",

      cus_name: appointment.name || "Customer",
      cus_email: appointment.email || "customer@gmail.com",
      cus_add1: "Dhaka",
      cus_city: "Dhaka",
      cus_country: "Bangladesh",
      cus_phone: "01700000000",
    };

    const sslcz = new SSLCommerzPayment(
      store_id,
      store_passwd,
      is_live
    );

    const apiResponse = await sslcz.init(data);

    return res.status(200).json({
      success: true,
      url: apiResponse.GatewayPageURL,
    });

  } catch (error) {
    console.error("Payment init error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Payment Success
export const paymentSuccess = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findByIdAndUpdate(appointmentId, {
      paymentStatus: "paid",
      status: "scheduled",
      paymentDate: new Date()
    }, { new: true });

    if (!appointment) {
      return res.redirect("http://localhost:5174/payment-failed");
    }

    // Redirect to success page with appointment ID
    res.redirect(`http://localhost:5174/payment-success?appointmentId=${appointmentId}`);

  } catch (error) {
    console.error("Payment success error:", error);
    res.redirect("http://localhost:5174/payment-failed");
  }
};

// Get Invoice Data
export const getInvoice = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    console.log('Getting invoice for appointment:', appointmentId);

    // Fetch appointment and populate pet details
    const appointment = await Appointment.findById(appointmentId).populate('petId');
    if (!appointment) {
      console.log('Appointment not found:', appointmentId);
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    console.log('Fetched appointment:', appointment);

    // Fetch user details
    const user = await User.findById(appointment.userId);
    console.log('Fetched user:', user);

    // Map actual Pet fields
    const pet = appointment.petId;
    const petDetails = {
      name: pet?.name || "N/A",     // use 'name'
      type: pet?.gender || "N/A",   // use 'gender' as type
      breed: pet?.breed || "N/A",   // use 'breed'
    };
    console.log('Pet Details to use in invoice:', petDetails);

    // Generate invoice data
    const invoiceData = {
      invoiceNumber: `INV-${appointment._id.toString().slice(-8).toUpperCase()}`,
      appointmentId: appointment._id,
      transactionId: appointment.paymentIntentId || `PETCARE_${Date.now()}`,
      date: appointment.paymentDate ? new Date(appointment.paymentDate).toLocaleDateString() : new Date().toLocaleDateString(),
      time: appointment.paymentDate ? new Date(appointment.paymentDate).toLocaleTimeString() : new Date().toLocaleTimeString(),

      // Customer details
      customer: {
        name: user?.name || appointment.userName,
        email: user?.email || appointment.email,
        phone: user?.phoneNumber || appointment.phoneNo,
      },

      // Pet details
      pet: petDetails,

      // Appointment details
      appointment: {
        type: appointment.appointmentType,
        date: new Date(appointment.appointmentDate || new Date()).toLocaleDateString(),
        time: appointment.appointmentTime,
        professional: "Veterinarian",
      },

      // Payment details
      payment: {
        amount: appointment.appointmentFee,
        currency: "BDT",
        status: appointment.paymentStatus === "paid" ? "Paid" : "Pending",
        method: "SSLCommerz",
      },

      // Company details
      company: {
        name: "FurEver Care",
        address: "Dhaka, Bangladesh",
        phone: "+880 1700-000000",
        email: "support@furevercare.com",
      },
    };

    console.log('Generated invoice data:', invoiceData);

    res.json({
      success: true,
      invoice: invoiceData
    });

  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate invoice",
      error: error.message
    });
  }
};

// Payment Failed
export const paymentFail = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    await Appointment.findByIdAndUpdate(appointmentId, {
      paymentStatus: "failed",
      status: "cancelled"
    });

    res.redirect("http://localhost:5174/payment-failed");
  } catch (error) {
    console.error("Payment fail handler error:", error);
    res.redirect("http://localhost:5174/payment-failed");
  }
};

// Payment Cancelled
export const paymentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    await Appointment.findByIdAndUpdate(appointmentId, {
      paymentStatus: "pending",
      status: "scheduled"
    });

    res.redirect("http://localhost:5174/payment-cancel");
  } catch (error) {
    console.error("Payment cancel handler error:", error);
    res.redirect("http://localhost:5174/payment-cancel");
  }
};

// Process instant refund for rejected appointments through SSLCommerz
export const processInstantRefund = async (appointmentId, rejectionReason) => {
  try {
    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Only process refund if appointment was paid
    if (appointment.paymentStatus !== "paid") {
      throw new Error("Appointment was not paid");
    }

    // Prepare refund data for SSLCommerz API
    const refundRefId = `REFUND_${appointment._id}_${Date.now()}`;
    
    const refundPayload = {
      store_id: store_id,
      store_passwd: store_passwd,
      refund_ref_id: refundRefId,
      refund_amount: appointment.appointmentFee,
      bank_tran_id: appointment.paymentIntentId || `PETCARE_${Date.now()}`,
      remark: `Full refund for appointment rejection: ${rejectionReason || 'No reason provided'}`
    };

    // Call SSLCommerz refund API
    const sslcz_refund_url = is_live 
      ? "https://securepay.sslcommerz.com/gwprocess/RefundProcess.php" 
      : "https://sandbox.sslcommerz.com/gwprocess/RefundProcess.php";

    let refundResponse = null;
    try {
      const response = await axios.post(sslcz_refund_url, refundPayload);
      refundResponse = response.data;
      console.log("SSLCommerz refund response:", refundResponse);
    } catch (sslError) {
      console.warn("SSLCommerz API call warning:", sslError.message);
      // Continue with local record even if SSLCommerz call fails
      refundResponse = {
        status: "submitted",
        error: sslError.message
      };
    }

    // Create a refund request record with full amount (no deductions for vet rejection)
    const refundRequest = new RefundRequest({
      appointmentId: appointment._id,
      userId: appointment.userId,
      amount: appointment.appointmentFee,
      processingFee: 0, // No deductions for vet rejection
      netAmount: appointment.appointmentFee, // Full refund
      status: "processed", // Marked as processed
      reason: `Appointment rejected by vet: ${rejectionReason || 'No reason provided'}`,
      paymentMethod: "sslcommerz",
      transactionId: refundRefId,
      adminNotes: `Automatic refund initiated through SSLCommerz. Status: ${refundResponse?.status || 'submitted'}. Bank Tran ID: ${appointment.paymentIntentId || 'N/A'}`
    });

    await refundRequest.save();

    // Update appointment to reflect refund processing
    appointment.paymentStatus = "refunded";
    await appointment.save();

    console.log(`Instant refund initiated for appointment ${appointmentId}: ${appointment.appointmentFee} BDT`);
    
    // Generate refund verification URL for frontend redirect
    const refundVerificationUrl = `http://localhost:5174/refund-confirmation?refundId=${refundRefId}&appointmentId=${appointmentId}&amount=${appointment.appointmentFee}&status=${refundResponse?.status || 'submitted'}`;
    
    return {
      success: true,
      refundRequest,
      sslcommerzRefundId: refundRefId,
      amount: appointment.appointmentFee,
      message: `Full refund of ${appointment.appointmentFee} BDT initiated through SSLCommerz`,
      refundVerificationUrl: refundVerificationUrl
    };
  } catch (error) {
    console.error("Error processing instant refund:", error);
    throw error;
  }
};