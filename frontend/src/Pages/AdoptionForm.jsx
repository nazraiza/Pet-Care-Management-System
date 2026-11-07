import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Dog, Cat, Heart, CheckCircle, Loader } from 'lucide-react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PetAdoptionForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { petName, petImage, petType } = location.state || {};

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('petOwnerToken');
    const userData = JSON.parse(localStorage.getItem('petOwnerUser') || '{}');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    // Split the full name into first and last name
    const [firstName = '', lastName = ''] = (userData.name || '').split(' ');

    // Auto-fill user data from localStorage
    setFormData(prev => ({
      ...prev,
      firstName: firstName,
      lastName: lastName,
      email: userData.email || '',
      phone: userData.phoneNumber || '', // Map phoneNumber to phone field
      petType: petType || '',
      preferredPet: petName || '',
      homeType: '',
      hasYard: false,
      otherPets: false,
      employmentStatus: '',
      additionalInfo: ''
    }));
  }, [navigate]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    petType: petType || '',
    preferredPet: petName || '',
    homeType: '',
    hasYard: false,
    otherPets: false,
    employmentStatus: '',
    additionalInfo: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [homeVisitSchedules, setHomeVisitSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedEndTime, setSelectedEndTime] = useState('');

  const petTypes = ['Dog', 'Cat', 'Either'];
  const homeTypes = ['House', 'Apartment', 'Condo', 'Other'];
  const employmentStatuses = ['Employed', 'Self-Employed', 'Student', 'Retired', 'Unemployed'];

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Helper function to convert 24-hour time to 12-hour with AM/PM
  const convertTo12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Helper function to convert 12-hour to 24-hour for storage
  const convertTo24Hour = (hour) => {
    return `${String(hour).padStart(2, '0')}:00`;
  };

  const getDateTimeFromPreference = (date, time) => {
    return new Date(`${date}T${time}:00`);
  };

  const isAtLeastHoursAhead = (date, time, hours) => {
    const selected = getDateTimeFromPreference(date, time);
    const threshold = new Date(Date.now() + hours * 60 * 60 * 1000);
    return selected.getTime() >= threshold.getTime();
  };

  // Add home visit schedule
  const handleAddHomeVisitSchedule = () => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      toast.error('Please select date and time range');
      return;
    }

    // Convert times to 24-hour format for comparison
    const startHour = parseInt(selectedStartTime.split(':')[0]);
    const endHour = parseInt(selectedEndTime.split(':')[0]);

    // Validate that times are within visiting hours (9 AM to 6 PM = 9 to 18)
    if (startHour < 9 || startHour >= 18) {
      toast.error('Start time must be between 9:00 AM and 6:00 PM');
      return;
    }

    if (endHour <= 9 || endHour > 18) {
      toast.error('End time must be between 9:00 AM and 6:00 PM');
      return;
    }

    if (selectedStartTime >= selectedEndTime) {
      toast.error('Start time must be before end time');
      return;
    }

    const startDateTime = getDateTimeFromPreference(selectedDate, selectedStartTime);
    const endDateTime = getDateTimeFromPreference(selectedDate, selectedEndTime);
    const now = new Date();

    if (startDateTime <= now) {
      toast.error('Please choose a preferred time at least 12 hours from now');
      return;
    }

    if (!isAtLeastHoursAhead(selectedDate, selectedStartTime, 12)) {
      toast.error('Please choose a preferred time at least 12 hours from now');
      return;
    }

    if (endDateTime <= startDateTime) {
      toast.error('End time must be after start time');
      return;
    }

    const newSchedule = {
      id: Date.now(),
      date: selectedDate,
      startTime: selectedStartTime,
      endTime: selectedEndTime
    };

    setHomeVisitSchedules([...homeVisitSchedules, newSchedule]);
    setSelectedDate('');
    setSelectedStartTime('');
    setSelectedEndTime('');
    toast.success('Time preference added');
  };

  // Remove home visit schedule
  const handleRemoveHomeVisitSchedule = (id) => {
    setHomeVisitSchedules(homeVisitSchedules.filter(schedule => schedule.id !== id));
    toast.info('Time preference removed');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    // Clear global error when user makes any change
    if (globalError) {
      setGlobalError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

const phoneRegex = /^01[3-9]\d{8}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone.replace(/[^\d]/g, ''))) {
      newErrors.phone = 'Invalid phone number (11 digits)';
    }

    if (!formData.petType) newErrors.petType = 'Please select a pet type';
    if (!formData.homeType) newErrors.homeType = 'Please select home type';
    if (!formData.employmentStatus) newErrors.employmentStatus = 'Please select employment status';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 ? {} : newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setGlobalError('Please fix the errors below before submitting.');
      return;
    }

    if (homeVisitSchedules.length === 0) {
      setGlobalError('Please add at least one home visit time preference.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('petOwnerToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Map the form data to match the backend schema
      const adoptionData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phone,
        petType: formData.petType,
        petName: formData.preferredPet,
        petImage: petImage,
        homeType: formData.homeType,
        employmentStatus: formData.employmentStatus,
        hasYard: formData.hasYard,
        hasOtherPets: formData.otherPets,
        additionalInfo: formData.additionalInfo,
        homeVisitPreferences: homeVisitSchedules
      };
      

      // Make API call to save adoption form
      const response = await axios.post(
        'https://pet-care-backend-422z.onrender.com/api/adoptionform/apply',
        adoptionData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 201) {
        setErrors({});
        setGlobalError('');
        setShowSuccessModal(true);
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/pet-register-dashboard', { state: { adoptionSuccess: true } });
        }, 2000);
      }
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          setGlobalError('Please log in to submit an adoption application.');
        } else if (data.message) {
          setGlobalError(data.message);
        } else {
          setGlobalError('An error occurred while submitting your application. Please try again.');
        }
      } else {
        setGlobalError('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success message component
  const SuccessMessage = () => (
    <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-md">
        <CheckCircle className="mx-auto mb-6 text-green-500" size={80} />
        <h2 className="text-3xl font-bold text-[#80533b] mb-4">Application Submitted!</h2>
        <p className="text-xl mb-6">
          Thank you, {formData.firstName}! Your pet adoption application has been successfully submitted.
        </p>
        <p className="text-md text-gray-600 mb-6">
          We will review your application and contact you soon.
        </p>
        <button 
          onClick={() => setShowSuccessModal(false)}
          className="bg-[#B3704D] text-white px-8 py-3 rounded-xl hover:bg-[#D08860] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      {showSuccessModal && <SuccessMessage />}
      
      <div className="min-h-screen bg-gradient-to-br from-[#F4E4D8] to-[#E6D5C1] pt-24 flex items-center justify-center p-6">
        <div className="w-full max-w-10xl bg-white shadow-2xl rounded-3xl overflow-hidden flex border-2 border-[] mt-6">
          {/* Pet Details Section */}
<div className="w-1/2 relative bg-black flex items-center justify-center overflow-hidden">
  {petImage ? (
    <img 
      src={petImage} 
      alt={petName || "Pet"} 
      className="w-full h-full object-contain object-center absolute inset-0"
    />
  ) : (
    <img 
      src="/api/placeholder/800/1200" 
      alt="Pet Adoption" 
      className="w-full h-full object-contain object-center absolute inset-0"
    />
  )}
            <div className="absolute inset-0 bg-gradient-to-r from-[]/60 to-[]/60 flex items-center justify-center">
              <div className="text-white text-center p-8">
                {petName && (
                  <div>
                    <h2 className="text-4xl font-bold mb-4">
                      {petName} is Waiting for You!
                    </h2>
                    <p className="text-xl mb-4">
                      {petType === 'Dog' ? <Dog className="inline mr-2" size={32} /> : <Cat className="inline mr-2" size={32} />}
                      {petType} Adoption
                    </p>
                  </div>
                )}
                <p className="text-xl">Open your heart and home to a loving pet today</p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="w-1/2 p-12 overflow-y-auto bg-white">
            <div className="flex items-center justify-center mb-8">
              <Heart className="text-[#80533b] mr-3" size={50} />
              <h2 className="text-3xl font-bold text-[#80533b]">Pet Adoption Application</h2>
            </div>

            {/* Global Error Message */}
            {globalError && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <div className="flex items-center">
                  <AlertCircle className="text-red-500 mr-2" size={20} />
                  <p className="text-red-700">{globalError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-md font-medium text-[] mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[] focus:outline-none focus:ring-2 focus:ring-[#B3704D] transition-all duration-300 hover:shadow-md"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-md font-medium text-[] mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[] focus:outline-none focus:ring-2 focus:ring-[#B3704D] transition-all duration-300 hover:shadow-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-md font-medium text-[] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[] focus:outline-none focus:ring-2 focus:ring-[#B3704D] transition-all duration-300 hover:shadow-md"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-md font-medium text-[] mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[] focus:outline-none focus:ring-2 focus:ring-[#B3704D] transition-all duration-300 hover:shadow-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="petType" className="block text-md font-medium text-[] mb-2">
                    Preferred Pet Type
                  </label>
                  <input
                    type="text"
                    id="petType"
                    name="petType"
                    value={formData.petType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[] focus:outline-none focus:ring-2 focus:ring-[#B3704D] transition-all duration-300 hover:shadow-md"
                  />
                </div>

                <div>
                  <label htmlFor="preferredPet" className="block text-md font-medium text-[] mb-2">
                    Preferred Pet Name
                  </label>
                  <input
                    type="text"
                    id="preferredPet"
                    name="preferredPet"
                    value={formData.preferredPet}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[] focus:outline-none focus:ring-2 focus:ring-[#B3704D] transition-all duration-300 hover:shadow-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="homeType" className="block text-md font-medium text-[] mb-2">
                    Home Type
                  </label>
                  <select
                    id="homeType"
                    name="homeType"
                    value={formData.homeType}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors.homeType ? 'border-red-500' : 'border-[]'
                    } focus:outline-none focus:ring-2 focus:ring-[#B3704D] transition-all duration-300 hover:shadow-md`}
                  >
                    <option value="">Select Home Type</option>
                    {homeTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.homeType && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <AlertCircle className="mr-2" size={18} /> {errors.homeType}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="employmentStatus" className="block text-md font-medium text-[] mb-2">
                    Employment Status
                  </label>
                  <select
                    id="employmentStatus"
                    name="employmentStatus"
                    value={formData.employmentStatus}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      errors.employmentStatus ? 'border-red-500' : 'border-[]'
                    } focus:outline-none focus:ring-2 focus:ring-[#B3704D] transition-all duration-300 hover:shadow-md`}
                  >
                    <option value="">Select Employment Status</option>
                    {employmentStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {errors.employmentStatus && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <AlertCircle className="mr-2" size={18} /> {errors.employmentStatus}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasYard"
                    name="hasYard"
                    checked={formData.hasYard}
                    onChange={handleChange}
                    className="h-5 w-5 text-[#B3704D] focus:ring-[#D08860] border-gray-300 rounded"
                  />
                  <label htmlFor="hasYard" className="ml-3 text-md text-gray-900">
                    Do you have a yard?
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="otherPets"
                    name="otherPets"
                    checked={formData.otherPets}
                    onChange={handleChange}
                    className="h-5 w-5 text-[#B3704D] focus:ring-[#D08860] border-gray-300 rounded"
                  />
                  <label htmlFor="otherPets" className="ml-3 text-md text-gray-900">
                    Do you have other pets?
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="additionalInfo" className="block text-md font-medium text-[] mb-2">
                  Additional Information
                </label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  rows={5}
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[] focus:outline-none focus:ring-2 focus:ring-[#B3704D] transition-all duration-300 hover:shadow-md"
                  placeholder="Tell us why you want to adopt a pet..."
                ></textarea>
              </div>

              {/* Home Visit Scheduling Section */}
              <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
                <h3 className="text-lg font-semibold text-[#4E2D21] mb-3">Home Visit Schedule</h3>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  Please indicate your preferred dates and times for the adoption manager to visit your home. 
                  You can select multiple days and time ranges between 9:00 AM and 6:00 PM. 
                  We will contact you to confirm the exact visit time.
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        id="visitDate"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={getTodayDate()}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#B3704D]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <select
                        id="startTime"
                        value={selectedStartTime}
                        onChange={(e) => setSelectedStartTime(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#B3704D]"
                      >
                        <option value="">Select time</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const hour = 9 + i;
                          const timeValue = `${String(hour).padStart(2, '0')}:00`;
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const hour12 = hour % 12 || 12;
                          return (
                            <option key={timeValue} value={timeValue}>
                              {String(hour12).padStart(2, '0')}:00 {ampm}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <select
                        id="endTime"
                        value={selectedEndTime}
                        onChange={(e) => setSelectedEndTime(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#B3704D]"
                      >
                        <option value="">Select time</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const hour = 9 + i;
                          const timeValue = `${String(hour).padStart(2, '0')}:00`;
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const hour12 = hour % 12 || 12;
                          return (
                            <option key={timeValue} value={timeValue}>
                              {String(hour12).padStart(2, '0')}:00 {ampm}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddHomeVisitSchedule}
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Add Time Preference
                  </button>
                </div>

                {/* Display Added Schedules */}
                {homeVisitSchedules.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="font-semibold text-[#4E2D21] text-sm">Your Visit Preferences:</h4>
                    {homeVisitSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border-l-4 border-blue-500"
                      >
                        <span className="text-sm text-gray-800">
                          {new Date(schedule.date).toLocaleDateString()} • {convertTo12Hour(schedule.startTime)} - {convertTo12Hour(schedule.endTime)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveHomeVisitSchedule(schedule.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full px-8 py-4 rounded-xl text-lg font-semibold flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#B3704D] hover:bg-[#D08860] text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="animate-spin mr-3" size={24} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Dog className="mr-3" size={24} />
                      Submit Adoption Application
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default PetAdoptionForm;