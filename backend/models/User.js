import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    role: {
  type: String,
  enum: ["pet_owner", "admin"],
  default: "pet_owner",
},
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    phoneNumber: {
  type: String,
  required: true,
  validate: {
    validator: function (v) {
      return /^01[3-9]\d{8}$/.test(v);
    },
    message: "Enter a valid Bangladeshi phone number (e.g. 01xxxxxxxxx)",
  },
},
    city: { type: String, required: true },
    password: { type: String, required: true },
    cartData: { type: Object, default: {} },
    profilePicture: { type: String, default: "" },
  },
  { timestamps: true } // Add timestamps
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error("Error in pre-save hook:", error); // Add error logging
    next(error); // Pass the error to Mongoose
  }
});

// Match entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error("Error in matchPassword:", error); // Add error logging
    throw error; // Rethrow the error for the controller to handle
  }
};

const User = mongoose.model("User", userSchema);
export default User;