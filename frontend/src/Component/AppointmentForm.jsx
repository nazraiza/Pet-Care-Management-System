import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaPaw,
  FaCalendar,
  FaClock,
  FaWallet,
} from "react-icons/fa";

const api = axios.create({
  baseURL: "http://localhost:5003/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("petOwnerToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AppointmentForm = ({ professional, onClose, appointmentType, appointmentFee }) => {
  const [pets, setPets] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [formData, setFormData] = useState({
    petId: "",
    doctorId: professional?.id || "",
    appointmentDate: "",
    appointmentTime: "",
    userName: "",
    phoneNo: "",
    email: "",
    appointmentType: "",
    appointmentFee: professional?.fee || 1,
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getMinAllowedDateTime = () => {
    const nextValid = new Date();
    nextValid.setHours(nextValid.getHours() + 2);
    nextValid.setSeconds(0);
    nextValid.setMilliseconds(0);
    return nextValid;
  };

  const isDateTimeAtLeastTwoHoursAhead = (dateString, timeString) => {
    if (!dateString || !timeString) return false;
    const [hour, minute] = timeString.split(":").map(Number);
    const appointment = new Date(dateString);
    appointment.setHours(hour, minute, 0, 0);
    return appointment >= getMinAllowedDateTime();
  };

  const mapAppointmentType = (type) => {
    const typeMap = {
      vet: "veterinarian",
    };
    return typeMap[type?.toLowerCase()] || "";
  };

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await api.get("/pets/getUserPets");
        setPets(response.data.pets || response.data.data || response.data || []);
      } catch (error) {
        console.error("Failed to fetch pets:", error);
      }
    };

    fetchPets();
  }, []);

  useEffect(() => {
    const mappedType = mapAppointmentType(appointmentType);

    setFormData((prev) => ({
      ...prev,
      doctorId: professional?.id || "",
      appointmentType: mappedType,
      appointmentFee: appointmentFee || professional?.fee || 1,
      appointmentTime: "",
    }));
  }, [professional, appointmentType, appointmentFee]);

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!formData.doctorId || !formData.appointmentDate) {
        setAvailableSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        setFormData((prev) => ({ ...prev, appointmentTime: "" }));

        const response = await api.get(
          `/availability/slots?doctorId=${formData.doctorId}&date=${formData.appointmentDate}`
        );

        const slots = response.data.slots || [];
        const filteredSlots = slots.filter((slot) => {
          if (!slot.time24) return false;
          return isDateTimeAtLeastTwoHoursAhead(formData.appointmentDate, slot.time24);
        });

        setAvailableSlots(filteredSlots);
      } catch (error) {
        console.error("Failed to fetch available slots:", error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [formData.doctorId, formData.appointmentDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const phoneRegex = /^01[3-9]\d{8}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.petId) errors.petId = "Please select a pet";
    if (!formData.doctorId) errors.doctorId = "Professional ID is required";
    if (!formData.userName.trim()) errors.userName = "Full name is required";
    if (!phoneRegex.test(formData.phoneNo)) errors.phoneNo = "Enter a valid Bangladeshi phone number";
    if (!emailRegex.test(formData.email)) errors.email = "Invalid email format";

    if (
      !formData.appointmentDate ||
      new Date(formData.appointmentDate) < new Date().setHours(0, 0, 0, 0)
    ) {
      errors.appointmentDate = "Appointment date must be today or in the future";
    }

    if (!formData.appointmentTime) {
      errors.appointmentTime = "Please select an available time slot";
    } else if (
      !isDateTimeAtLeastTwoHoursAhead(formData.appointmentDate, formData.appointmentTime)
    ) {
      errors.appointmentTime = "Appointment must be at least 2 hours from now";
    }
    if (!formData.appointmentType) errors.appointmentType = "Appointment type is required";

    if (isNaN(formData.appointmentFee) || Number(formData.appointmentFee) <= 0) {
      errors.appointmentFee = "Appointment fee must be a positive number";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/appointments/create", {
        petId: formData.petId,
        doctorId: formData.doctorId,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        userName: formData.userName,
        phoneNo: formData.phoneNo,
        email: formData.email,
        appointmentType: formData.appointmentType,
        appointmentFee: Number(formData.appointmentFee),
      });

      if (response.data.success) {
        // If SSLCommerz payment URL is provided, redirect to payment
        if (response.data.url) {
          window.location.href = response.data.url;
        } else {
          alert("Appointment confirmed successfully");
          onClose();
        }
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert(error.response?.data?.message || "Failed to confirm appointment. Please try again.");
      setIsSubmitting(false);
    }
  };

  const renderInputField = (name, label, type, icon, options = null, readOnly = false) => {
    const IconComponent = icon;

    const inputClass = `w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#D08860] focus:border-[#D08860] transition duration-300 font-medium shadow-sm hover:border-[#D08860] hover:border-opacity-50 ${
      readOnly ? "bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed" : "text-gray-700"
    }`;

    if (options) {
      return (
        <div className="mb-6">
          <label className="block font-semibold mb-3 flex items-center text-gray-800">
            {IconComponent && <IconComponent className="mr-2 text-[#D08860]" size={18} />}
            {label}
          </label>

          <select
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className={inputClass}
            disabled={readOnly}
          >
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {formErrors[name] && <p className="text-red-500 text-sm mt-2 font-medium">{formErrors[name]}</p>}
        </div>
      );
    }

    return (
      <div className="mb-6">
        <label className="block font-semibold mb-3 flex items-center text-gray-800">
          {IconComponent && <IconComponent className="mr-2 text-[#D08860]" size={18} />}
          {label}
        </label>

        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          className={inputClass}
          readOnly={readOnly}
          placeholder={`Enter ${label}`}
          min={type === "date" ? getTodayDateString() : undefined}
        />

        {formErrors[name] && <p className="text-red-500 text-sm mt-2 font-medium">{formErrors[name]}</p>}
      </div>
    );
  };

  const appointmentTypeOptions = [
    { value: "veterinarian", label: "Veterinarian" },
  ];

  const petOptions = Array.isArray(pets)
    ? pets.map((pet) => ({
        value: pet._id,
        label: `${pet.name} (${pet.breed || "Pet"})`,
      }))
    : [];

  const slotOptions = availableSlots.map((slot) => ({
  value: slot.time24,
  label: slot.time12,
}));

  return (
    <div className="max-w-2xl mx-auto p-8 shadow-2xl rounded-2xl bg-white mt-8 border-2 border-[#D08860] border-opacity-20 backdrop-blur-sm transform transition-all duration-300 hover:shadow-xl">
      <div className="text-center mb-10">
        <div className="inline-block p-4 rounded-full bg-gradient-to-br from-[#D08860] to-[#D08860] bg-opacity-15 mb-5 shadow-md">
          <FaCalendar className="text-[#D08860]" size={28} />
        </div>
        <h2 className="text-3xl font-bold text-[#D08860] mb-2">Book an Appointment</h2>
        <p className="text-gray-600 text-lg font-medium">with {professional?.name}</p>
        <div className="h-1 w-20 bg-gradient-to-r from-[#D08860] to-[#D08860] opacity-30 rounded-full mx-auto mt-3"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gradient-to-r from-[#D08860] from-opacity-5 to-transparent p-5 rounded-xl mb-6">
          {renderInputField("petId", "Select Your Pet", "select", FaPaw, petOptions)}
        </div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
  {/* Professional ID */}
  <div className="bg-gray-50 p-5 rounded-xl flex flex-col justify-center">
    <label className="block font-semibold mb-0 flex items-center text-gray-800">
      <FaUser className="mr-2 text-[#D08860]" size={18} />
      Professional ID
    </label>
    <input
      type="text"
      name="doctorId"
      value={formData.doctorId}
      readOnly
      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600 font-medium cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#D08860] focus:border-[#D08860] transition duration-300"
    />
  </div>

  {/* Service Type */}
  <div className="bg-gray-50 p-5 rounded-xl flex flex-col justify-center">
    <label className="block font-semibold mb-0 flex items-center text-gray-800">
      <FaPaw className="mr-2 text-[#D08860]" size={18} />
      Service Type
    </label>
    <input
      type="text"
      name="appointmentType"
      value={formData.appointmentType || "Veterinarian"}
      readOnly
      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600 font-medium cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#D08860] focus:border-[#D08860] transition duration-300"
    />
  </div>
</div>

        <div className="bg-blue-50 border-l-4 border-[#D08860] p-5 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex-grow">
              {renderInputField("appointmentFee", "Appointment Fee (BDT ৳)", "number", FaWallet, null, true)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-gray-50 p-5 rounded-xl">
            {renderInputField("userName", "Full Name", "text", FaUser)}
          </div>
          <div className="bg-gray-50 p-5 rounded-xl">
            {renderInputField("phoneNo", "Phone Number", "tel", FaPhone)}
          </div>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl">
          {renderInputField("email", "Email Address", "email", FaEnvelope)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-amber-50 p-5 rounded-xl">
            {renderInputField("appointmentDate", "Appointment Date", "date", FaCalendar)}
          </div>

          <div className="bg-amber-50 p-5 rounded-xl">
            {loadingSlots ? (
              <p className="text-gray-500 mt-8">Loading available slots...</p>
            ) : formData.appointmentDate && availableSlots.length === 0 ? (
              <div className="mb-6">
                <label className="block font-medium mb-2 flex items-center text-gray-700">
                  <FaClock className="mr-2 text-[#D08860]" size={18} />
                  Appointment Time
                </label>
                <select className="w-full px-4 py-3 border rounded-lg bg-gray-100 text-gray-600 font-medium" disabled>
                  <option>No available slots for this date</option>
                </select>
                {formErrors.appointmentTime && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.appointmentTime}</p>
                )}
              </div>
            ) : (
              renderInputField("appointmentTime", "Select Time", "select", FaClock, slotOptions)
            )}
          </div>
        </div>

        <div className="mt-10 flex justify-between gap-4 pt-6 border-t-2 border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all duration-300 shadow-md hover:shadow-lg font-semibold transform hover:scale-105"
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className={`flex-1 px-6 py-3 bg-gradient-to-r from-[#D08860] to-[#B3714E] text-white rounded-lg hover:from-[#B3714E] hover:to-[#9E5F3B] transition-all duration-300 shadow-md hover:shadow-lg font-semibold flex items-center justify-center gap-2 transform hover:scale-105 ${
              isSubmitting ? "opacity-70 cursor-not-allowed scale-100" : ""
            }`}
            disabled={isSubmitting}
          >
            <FaCalendar size={18} />
            {isSubmitting ? "Processing..." : "Confirm Appointment"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;