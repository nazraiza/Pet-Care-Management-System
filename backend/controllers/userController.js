import User from "../models/User.js";
import jwt from "jsonwebtoken";
import Pet from "../models/Pet.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

export const registerUser = async (req, res) => {
  const { name, email, phoneNumber, city, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    let profilePicture = "";

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "users",
          use_filename: true,
          resource_type: "auto",
        });

        profilePicture = result.secure_url;

        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting temporary file:", unlinkError);
        }
      } catch (uploadError) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting temporary file after failed upload:", unlinkError);
        }

        return res.status(500).json({
          message: "Error uploading profile picture",
          error: uploadError.message,
        });
      }
    }

    const newUser = new User({
      name,
      email,
      phoneNumber,
      city,
      password,
      profilePicture,
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        city: newUser.city,
        profilePicture: newUser.profilePicture,
        role: newUser.role,
        token: generateToken(newUser),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
  console.log("LOGIN USER ROLE:", user.role);

  return res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    city: user.city,
    profilePicture: user.profilePicture,
    role: user.role,
    token: generateToken(user),
  });
}

    return res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    return res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email, phoneNumber, city } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: "Email already in use" });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.city = city || user.city;

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "users",
          use_filename: true,
          resource_type: "auto",
        });

        user.profilePicture = result.secure_url;

        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting temporary file:", unlinkError);
        }
      } catch (uploadError) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting temporary file after failed upload:", unlinkError);
        }

        return res.status(500).json({
          message: "Error uploading profile picture",
          error: uploadError.message,
        });
      }
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        city: user.city,
        profilePicture: user.profilePicture,
        role: user.role,
      },
      token: generateToken(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

export const deleteProfile = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await Pet.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Profile and associated data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting profile", error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await Pet.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};