import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  petId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Pet",
  required: true,
},
  doctorId: {
    type: String,
    required: [true, "Doctor ID is required"],
    index: true,
  },
  appointmentDate: {
    type: Date,
    required: [true, "Appointment date is required"],
    validate: {
      validator: function (v) {
        if (!v) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const appointmentDay = new Date(
          v.getFullYear(),
          v.getMonth(),
          v.getDate()
        );
        return appointmentDay.getTime() >= today.getTime();
      },
      message: "Appointment date must be today or in the future",
    },
  },
  appointmentTime: {
    type: String,
    required: [true, "Appointment time is required"],
  },
  userName: {
    type: String,
    required: [true, "User name is required"],
    trim: true,
    maxlength: [100, "Name cannot be more than 100 characters"],
  },
  phoneNo: {
  type: String,
  required: [true, "Phone number is required"],
  validate: {
    validator: (v) => /^01[3-9]\d{8}$/.test(v),
    message: "Enter a valid Bangladeshi phone number (e.g. 01xxxxxxxxx)",
  },
  minLength: [11, "Phone number must be 11 digits"],
  maxLength: [11, "Phone number must be 11 digits"],
},
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: "Invalid email format",
    },
  },
  appointmentType: {
    type: String,
    required: [true, "Appointment type is required"],
    enum: {
      values: ["veterinarian", "groomer", "trainer"],
      message: "Appointment type must be veterinarian, groomer, or trainer",
    },
  },
  appointmentFee: {
    type: Number,
    required: [true, "Appointment fee is required"],
    min: [0, "Appointment fee must be greater than or equal to 0"],
    validate: {
      validator: (v) => !isNaN(v) && v > 0,
      message: "Appointment fee must be a positive number",
    },
  },
 status: {
  type: String,
  default: "scheduled",
  enum: {
    values: [
      "payment_pending",
      "paid",
      "approved",
      "in_progress",
      "completed",
      "rejected",
      "cancelled",
      "missed",
      "scheduled"
    ],
    message: "Invalid appointment status",
  },
},
approvedAt: Date,
rejectedAt: Date,
rejectionReason: {
  type: String,
  default: "",
},
startedAt: Date,
completedAt: Date,
cancelledAt: Date,
cancelReason: {
  type: String,
  default: "",
},
  paymentStatus: {
    type: String,
    default: "pending",
    enum: {
      values: ["pending", "paid", "failed", "refunded"],
      message: "Payment status must be pending, paid, failed, or refunded",
    },
  },
  paymentIntentId: {
    type: String,
    sparse: true,
  },
  paymentDate: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, appointmentTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["scheduled", "approved", "in_progress"] },
    },
  }
);

export default mongoose.model("Appointment", appointmentSchema);