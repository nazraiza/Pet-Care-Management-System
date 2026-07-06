import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import Appointment from "../models/Appointment.js";
import Professional from "../models/professionalModel.js";

// Get total registrations per event
export const getRegistrationsPerEvent = async (req, res) => {
  try {
    const registrations = await Registration.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$eventId",
          totalRegistrations: { $sum: "$tickets" },
        },
      },
      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "_id",
          as: "eventDetails",
        },
      },
      { $unwind: "$eventDetails" },
      {
        $project: {
          eventTitle: "$eventDetails.title",
          totalRegistrations: 1,
        },
      },
    ]);
    res.json({ success: true, data: registrations });
  } catch (err) {
    console.error("Error fetching registrations per event:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get revenue per event with date filter
export const getRevenuePerEvent = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = { status: "active", paymentStatus: "paid" };
    if (startDate && endDate) {
      matchStage.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const registrations = await Registration.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "eventDetails",
        },
      },
      { $unwind: "$eventDetails" },
      {
        $group: {
          _id: "$eventId",
          totalTickets: { $sum: "$tickets" },
          totalRefundAmount: { $sum: { $ifNull: ["$refundAmount", 0] } },
          eventPrice: { $first: "$eventDetails.price" },
          eventTitle: { $first: "$eventDetails.title" },
        },
      },
      {
        $project: {
          eventTitle: 1,
          totalRevenue: {
            $subtract: [
              { $multiply: ["$totalTickets", { $ifNull: ["$eventPrice", 0] }] },
              "$totalRefundAmount",
            ],
          },
        },
      },
    ]);
    res.json({ success: true, data: registrations });
  } catch (err) {
    console.error("Error fetching revenue per event:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get registration trends over time with date filter
export const getRegistrationTrends = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = { status: "active" };
    if (startDate && endDate) {
      matchStage.registeredAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const registrations = await Registration.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$registeredAt" },
          },
          totalRegistrations: { $sum: "$tickets" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data: registrations });
  } catch (err) {
    console.error("Error fetching registration trends:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get event status breakdown
export const getEventStatusBreakdown = async (req, res) => {
  try {
    const statuses = await Event.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    res.json({ success: true, data: statuses });
  } catch (err) {
    console.error("Error fetching event status breakdown:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get registrations by location
export const getRegistrationsByLocation = async (req, res) => {
  try {
    const registrations = await Registration.aggregate([
      { $match: { status: "active" } },
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "eventDetails",
        },
      },
      { $unwind: "$eventDetails" },
      {
        $group: {
          _id: "$eventDetails.location",
          totalRegistrations: { $sum: "$tickets" },
        },
      },
    ]);
    res.json({ success: true, data: registrations });
  } catch (err) {
    console.error("Error fetching registrations by location:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get refunded registrations
export const getRefundedRegistrations = async (req, res) => {
  try {
    const data = await Registration.aggregate([
      { $match: { status: "cancelled", refundStatus: "completed" } },
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "eventDetails",
        },
      },
      { $unwind: "$eventDetails" },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          eventTitle: "$eventDetails.title",
          userName: "$userDetails.name",
          userEmail: "$userDetails.email",
          tickets: 1,
          refundAmount: 1,
          cancelledAt: 1,
        },
      },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Error fetching refunded registrations:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get appointments report grouped by professional for a given period
export const getAppointmentsReport = async (req, res) => {
  try {
    const period = (req.query.period || 'monthly').toLowerCase(); // weekly | monthly | yearly

    const now = new Date();
    let startDate;
    let endDate = new Date(now);

    if (period === 'weekly') {
      // last 7 days (including today)
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0,0,0,0);
      endDate.setHours(23,59,59,999);
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0,0,0,0);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else {
      // default monthly: start of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0,0,0,0);
      endDate.setHours(23,59,59,999);
    }

    const match = {
      appointmentDate: { $gte: startDate, $lte: endDate },
      status: { $in: ["scheduled", "approved", "completed"] },
    };

    const data = await Appointment.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$doctorId",
          totalAppointments: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "professionals",
          localField: "_id",
          foreignField: "pID",
          as: "professional",
        },
      },
      { $unwind: { path: "$professional", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          doctorId: "$_id",
          professionalName: "$professional.pName",
          professionalEmail: "$professional.pemail",
          role: "$professional.role",
          totalAppointments: 1,
        },
      },
      { $sort: { totalAppointments: -1 } },
    ]).allowDiskUse(true);

    // Also fetch the full appointment list for the period
    const appointments = await Appointment.aggregate([
      { $match: match },
      { $sort: { appointmentDate: -1, appointmentTime: -1 } },
      {
        $lookup: {
          from: "professionals",
          localField: "doctorId",
          foreignField: "pID",
          as: "professional",
        },
      },
      { $unwind: { path: "$professional", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          appointmentId: "$_id",
          appointmentDate: 1,
          appointmentTime: 1,
          userId: 1,
          userName: 1,
          userEmail: "$user.email",
          phoneNo: 1,
          email: 1,
          appointmentType: 1,
          appointmentFee: 1,
          status: 1,
          doctorId: 1,
          professionalName: "$professional.pName",
          professionalEmail: "$professional.pemail",
          professionalRole: "$professional.role",
          createdAt: 1,
        },
      },
    ]).allowDiskUse(true);

    res.json({ success: true, period, startDate, endDate, data, appointments });
  } catch (err) {
    console.error("Error fetching appointments report:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};