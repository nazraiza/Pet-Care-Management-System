import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, Heart, Eye, EyeOff, Shield, UserPlus, Users, UserCog, LogOut, Stethoscope, Scissors, GraduationCap, Award, FileText, Camera, ChevronDown, Lock, Mail, User } from "lucide-react";
import { motion } from "framer-motion";

const ProfessionalRegistration = () => {
  const [formData, setFormData] = useState({
    pName: "",
    role: "groomer",
    pID: "",
    pemail: "",
    ppassword: "",
    pphoneNumber: "",
    qualification: "",
    experience: "",
    description: "",
    pIDNumber: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Get admin name from localStorage or set default
  const admin = JSON.parse(localStorage.getItem('admin')) || { name: 'Admin' };
  const adminName = admin.name || 'Admin';

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    navigate('/StaffLogin');
  };

  const getPIDPrefix = (role) => {
    switch (role) {
      case "groomer":
        return "gro";
      case "veterinarian":
        return "vet";
      case "pet-trainer":
        return "pet";
      default:
        return "";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "groomer":
        return <Scissors className="text-amber-600" size={20} />;
      case "veterinarian":
        return <Stethoscope className="text-amber-600" size={20} />;
      case "pet-trainer":
        return <Award className="text-amber-600" size={20} />;
      default:
        return <UserPlus className="text-amber-600" size={20} />;
    }
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      pID: `${getPIDPrefix(prev.role)}${prev.pIDNumber}`,
    }));
  }, [formData.role, formData.pIDNumber]);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^01[3-9]\d{8}$/;
    const pidNumberRegex = /^\d{3}$/;

    if (!formData.pName.trim()) newErrors.pName = "Name is required";
    if (!formData.pIDNumber.trim()) newErrors.pIDNumber = "Professional ID number is required";
    else if (!pidNumberRegex.test(formData.pIDNumber))
      newErrors.pIDNumber = "Professional ID number must be exactly 3 digits";
    if (!formData.pemail.trim()) newErrors.pemail = "Email is required";
    else if (!emailRegex.test(formData.pemail)) newErrors.pemail = "Invalid email format";
    if (!formData.ppassword.trim()) newErrors.ppassword = "Password is required";
    else if (formData.ppassword.length < 8) newErrors.ppassword = "Password must be at least 8 characters";
    if (!formData.pphoneNumber.trim()) newErrors.pphoneNumber = "Phone number is required";
    else if (!phoneRegex.test(formData.pphoneNumber))
      newErrors.pphoneNumber = "Phone number must be exactly 11 digits";
    if (!formData.qualification.trim()) newErrors.qualification = "Qualification is required";
    if (!formData.experience.trim()) newErrors.experience = "Experience is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (validateForm()) {
      try {
        const formDataToSend = new FormData();
        
        // Append all form fields
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formDataToSend.append(key, value);
          }
        });

        // Append profile picture if exists
        if (profilePicture) {
          formDataToSend.append("profilePicture", profilePicture);
        }

        console.log("Submitting form data:", {
          pName: formData.pName,
          role: formData.role,
          pID: formData.pID,
          pemail: formData.pemail,
          pphoneNumber: formData.pphoneNumber,
          qualification: formData.qualification,
          experience: formData.experience,
          description: formData.description,
          hasProfilePicture: !!profilePicture
        });

        const response = await fetch("https://pet-care-backend-422z.onrender.com/api/professionals/register", {
          method: "POST",
          body: formDataToSend,
        });

        const data = await response.json();

        if (response.ok) {
          alert("Registration successful! Please wait for verification.");
          setFormData({
            pName: "",
            role: "groomer",
            pID: "",
            pemail: "",
            ppassword: "",
            pphoneNumber: "",
            qualification: "",
            experience: "",
            description: "",
            pIDNumber: "",
          });
          setProfilePicture(null);
          navigate("/ProfessionalRegistration");
        } else {
          console.error("Registration failed:", data);
          setErrors({ submit: data.message || "Registration failed" });
        }
      } catch (error) {
        console.error("Registration error:", error);
        setErrors({ submit: "Server error. Please try again." });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-25 to-amber-50">
      {/* Professional Header */}
      <header className="bg-white shadow-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <Link to="/admin/redirect/user_admin" className="flex items-center space-x-3 group">
                <div className="p-2 bg-gradient-to-r from-slate-600 to-slate-800 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Shield className="text-white" size={24} />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Admin Portal</span>
              </Link>
              <nav className="hidden lg:flex space-x-6">
                <Link to="/ProfessionalRegistration" className="flex items-center space-x-2 px-4 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 font-medium">
                  <UserPlus size={18} />
                  <span>Add Staff</span>
                </Link>
                <Link to="/ProfessionalsList" className="flex items-center space-x-2 px-4 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 font-medium">
                  <Users size={18} />
                  <span>Staff List</span>
                </Link>
                <Link to="/UsersList" className="flex items-center space-x-2 px-4 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 font-medium">
                  <UserCog size={18} />
                  <span>User List</span>
                </Link>
                <Link to="/AdminRegister" className="flex items-center space-x-2 px-4 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 font-medium">
                  <Shield size={18} />
                  <span>Add Admin</span>
                </Link>
              </nav>
            </div>

            {/* Right side - User info and Logout */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-800 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">{adminName.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-slate-700 font-semibold">Welcome, {adminName}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Hero Section */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/10 via-transparent to-slate-600/10"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-amber-500/20 rounded-xl backdrop-blur-sm">
                    <Heart className="text-amber-300" size={32} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Add Professional</h1>
                    <p className="text-amber-200">Expand Our Team</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <Stethoscope className="text-amber-300" size={24} />
                      <h3 className="text-xl font-semibold">Veterinarians</h3>
                    </div>
                    <p className="text-slate-300 text-sm">Expert medical care for all pets</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <Scissors className="text-amber-300" size={24} />
                      <h3 className="text-xl font-semibold">Groomers</h3>
                    </div>
                    <p className="text-slate-300 text-sm">Professional grooming services</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <Award className="text-amber-300" size={24} />
                      <h3 className="text-xl font-semibold">Pet Trainers</h3>
                    </div>
                    <p className="text-slate-300 text-sm">Behavioral training experts</p>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-2xl border border-amber-400/30">
                  <p className="text-amber-100 text-sm leading-relaxed">
                    "Join our professional team and make a difference in pet care. We provide comprehensive training and support to help you excel in your role."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-amber-800 p-8 text-white">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <UserPlus className="text-amber-200" size={28} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Professional Registration</h2>
                    <p className="text-amber-100 mt-1">Create a new professional account</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Personal Information Section */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-slate-200 rounded-lg">
                        <User className="text-slate-600" size={20} />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800">Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="pName" className="block text-sm font-medium text-slate-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="pName"
                          name="pName"
                          value={formData.pName}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 rounded-xl border-2 ${
                            errors.pName ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                          } focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors`}
                          placeholder="Enter full name"
                        />
                        {errors.pName && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertCircle className="mr-2" size={16} /> {errors.pName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
                          Professional Role *
                        </label>
                        <div className="relative">
                          <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors appearance-none"
                          >
                            <option value="groomer">Groomer</option>
                            <option value="veterinarian">Veterinarian</option>
                            <option value="pet-trainer">Pet Trainer</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Professional Credentials Section */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-slate-200 rounded-lg">
                        {getRoleIcon(formData.role)}
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800">Professional Credentials</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="pIDNumber" className="block text-sm font-medium text-slate-700 mb-2">
                          Professional ID *
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-4 py-3 bg-slate-200 border-2 border-r-0 border-slate-300 rounded-l-xl text-slate-700 font-medium">
                            {getPIDPrefix(formData.role)}
                          </span>
                          <input
                            type="text"
                            id="pIDNumber"
                            name="pIDNumber"
                            value={formData.pIDNumber}
                            onChange={handleChange}
                            className={`flex-1 px-4 py-3 rounded-r-xl border-2 ${
                              errors.pIDNumber ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                            } focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors`}
                            placeholder="123"
                            maxLength="3"
                          />
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          Generated ID: <span className="font-mono font-semibold text-slate-800">{formData.pID || "Select role and enter 3 digits"}</span>
                        </p>
                        {errors.pIDNumber && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertCircle className="mr-2" size={16} /> {errors.pIDNumber}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="qualification" className="block text-sm font-medium text-slate-700 mb-2">
                          Qualification *
                        </label>
                        <input
                          type="text"
                          id="qualification"
                          name="qualification"
                          value={formData.qualification}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 rounded-xl border-2 ${
                            errors.qualification ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                          } focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors`}
                          placeholder="e.g., DVM, Certified Groomer"
                        />
                        {errors.qualification && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertCircle className="mr-2" size={16} /> {errors.qualification}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="experience" className="block text-sm font-medium text-slate-700 mb-2">
                          Experience *
                        </label>
                        <input
                          type="text"
                          id="experience"
                          name="experience"
                          value={formData.experience}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 rounded-xl border-2 ${
                            errors.experience ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                          } focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors`}
                          placeholder="e.g., 5 years"
                        />
                        {errors.experience && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertCircle className="mr-2" size={16} /> {errors.experience}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-slate-200 rounded-lg">
                        <Mail className="text-slate-600" size={20} />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800">Contact Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="pemail" className="block text-sm font-medium text-slate-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="pemail"
                          name="pemail"
                          value={formData.pemail}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 rounded-xl border-2 ${
                            errors.pemail ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                          } focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors`}
                          placeholder="professional@example.com"
                        />
                        {errors.pemail && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertCircle className="mr-2" size={16} /> {errors.pemail}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="pphoneNumber" className="block text-sm font-medium text-slate-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="text"
                          id="pphoneNumber"
                          name="pphoneNumber"
                          value={formData.pphoneNumber}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 rounded-xl border-2 ${
                            errors.pphoneNumber ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                          } focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors`}
                          placeholder="11-digit phone number"
                          maxLength="11"
                        />
                        {errors.pphoneNumber && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertCircle className="mr-2" size={16} /> {errors.pphoneNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Security Section */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-slate-200 rounded-lg">
                        <Lock className="text-slate-600" size={20} />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800">Security</h3>
                    </div>

                    <div>
                      <label htmlFor="ppassword" className="block text-sm font-medium text-slate-700 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="ppassword"
                          name="ppassword"
                          value={formData.ppassword}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 pr-12 rounded-xl border-2 ${
                            errors.ppassword ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                          } focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors`}
                          placeholder="Minimum 8 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {errors.ppassword && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertCircle className="mr-2" size={16} /> {errors.ppassword}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Additional Information Section */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-slate-200 rounded-lg">
                        <FileText className="text-slate-600" size={20} />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800">Additional Information</h3>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label htmlFor="profilePicture" className="block text-sm font-medium text-slate-700 mb-2">
                          Profile Picture
                        </label>
                        <input
                          type="file"
                          id="profilePicture"
                          name="profilePicture"
                          onChange={(e) => setProfilePicture(e.target.files[0])}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                          accept="image/jpeg,image/png"
                        />
                        <p className="mt-2 text-sm text-slate-500">Optional. JPG or PNG format only.</p>
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                          Professional Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
                          placeholder="Tell us about your experience and specialties..."
                          rows="4"
                        />
                        <p className="mt-2 text-sm text-slate-500">Optional. Maximum 500 characters.</p>
                      </div>
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-center text-sm text-red-600 flex items-center justify-center">
                        <AlertCircle className="mr-2" size={18} /> {errors.submit}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-6">
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-slate-800 to-amber-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-slate-900 hover:to-amber-800 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
                    >
                      <UserPlus size={24} />
                      <span>Register Professional</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalRegistration;