import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Calendar, Clock, List, X, CalendarClock, ChevronDown, ChevronUp, FileText, User, Mail, Phone, MapPin, CreditCard, PawPrint, ShoppingBag, Ticket, Download, Edit } from 'lucide-react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate for logout

const theme = {
  primary: "bg-[#D08860]",
  secondary: "bg-[#B3714E]",
  textPrimary: "text-white",
  textSecondary: "text-amber-950",
  accent: "bg-amber-100",
  border: "border-amber-200",
};

// Axios instance with token interceptor
const api = axios.create({
  baseURL: 'https://pet-care-backend-422z.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('petOwnerToken'); // Use petOwnerToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ProfilePage = () => {
  const [showAppointmentSection, setShowAppointmentSection] = useState(false);
  const [showAdoptionSection, setShowAdoptionSection] = useState(false);
  const [showProductSection, setShowProductSection] = useState(false);
  const [showEventSection, setShowEventSection] = useState(false);
  const [showPrescriptionSection, setShowPrescriptionSection] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [adoptions, setAdoptions] = useState([]); // Added state for adoptions
  const [products, setProducts] = useState([]); // Added state for products
  const [events, setEvents] = useState([]); // Added state for events
  const [searchError, setSearchError] = useState('');
  const [adoptionError, setAdoptionError] = useState(''); // Added error state for adoptions
  const [productError, setProductError] = useState(''); // Added error state for products
  const [eventError, setEventError] = useState(''); // Added error state for events
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAdoptions, setIsLoadingAdoptions] = useState(false); // Added loading state for adoptions
  const [isLoadingProducts, setIsLoadingProducts] = useState(false); // Added loading state for products
  const [isLoadingEvents, setIsLoadingEvents] = useState(false); // Added loading state for events
  const [isCancelling, setIsCancelling] = useState(false);
  const [user, setUser] = useState(null);
  const [userError, setUserError] = useState('');
  const [pets, setPets] = useState([]);
  const [isLoadingPets, setIsLoadingPets] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [petsError, setPetsError] = useState('');
  const [reports, setReports] = useState([]);

  const navigate = useNavigate(); // Added for logout navigation

  const defaultProfilePic = "/assets/add.jpg";
  // Fetch user profile, pets, adoptions, products, and events on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setUserError('');

      try {
        const response = await api.get('/users/profile');
        setUser({
          ...response.data,
          phone: response.data.phoneNumber,
          address: response.data.city,
          membership: "Premium",
          memberSince: "2021-03-15"

        });
      } catch (error) {
        if (error.response?.status === 401) {
          setUserError('Please log in to view your profile');
        } else if (error.response?.status === 404) {
          setUserError('User profile not found');
        } else {
          setUserError(error.response?.data?.message || 'Failed to fetch profile');
        }
        console.error('Fetch user error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPets = async () => {
      setIsLoadingPets(true);
      setPetsError('');

      try {
        const response = await api.get('/pets/getUserPets');
        setPets(response.data || []);
        // Extract all medical reports from pets' medicalRecords
        const allReports = [];
        (response.data || []).forEach(pet => {
          if (pet.medicalRecords) {
            pet.medicalRecords.forEach(record => {
              allReports.push({
                ...record,
                petName: pet.name,
                petId: pet._id,
              });
            });
          }
        });
        setReports(allReports);
      } catch (error) {
        if (error.response?.status === 404) {
          setPetsError('No pets found');
          setPets([]);
        } else {
          setPetsError(error.response?.data?.message || 'Failed to fetch pets');
        }
        console.error('Fetch pets error:', error);
      } finally {
        setIsLoadingPets(false);
      }
    };

    fetchUserProfile();
    fetchPets();
  }, []);

  const fetchAppointments = async () => {
    setIsLoading(true);
    setSearchError('');

    try {
      const response = await api.get('/appointments/active');
      const { appointments: fetchedAppointments } = response.data;
      setAppointments(fetchedAppointments || []);
    } catch (error) {
      if (error.response?.status === 401) {
        setSearchError('Please log in to view appointments');
      } else if (error.response?.status === 404) {
        setSearchError('No active appointments found');
        setAppointments([]);
      } else {
        setSearchError(error.response?.data?.message || 'Failed to fetch appointments');
      }
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdoptions = async () => {
    setIsLoadingAdoptions(true);
    setAdoptionError('');

    try {
      const response = await api.get('/adoptionform/my-applications');
      const payload = response.data;
      const adoptionData = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : [];
      setAdoptions(adoptionData);
    } catch (error) {
      if (error.response?.status === 401) {
        setAdoptionError('Please log in to view adoptions');
      } else if (error.response?.status === 404) {
        setAdoptionError('No adoption records found');
        setAdoptions([]);
      } else {
        setAdoptionError(error.response?.data?.message || 'Failed to fetch adoptions');
      }
      console.error('Fetch adoptions error:', error);
    } finally {
      setIsLoadingAdoptions(false);
    }
  };

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    setProductError('');

    try {
      const token = localStorage.getItem('petOwnerToken');
      if (!token) {
        setProductError('Please login to view orders');
        setIsLoadingProducts(false);
        return;
      }

      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenData.userId;

      const response = await axios.post(
        `https://pet-care-backend-422z.onrender.com/api/order/user`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setProducts(response.data.orders || []);
      } else {
        setProductError(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        setProductError('Session expired. Please login again');
        navigate('/login');
      } else {
        setProductError(error.response?.data?.message || 'Failed to fetch orders');
      }
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    setEventError('');

    try {
      const response = await api.get('/registrations/user');
      setEvents(response.data?.registrations || []);
    } catch (error) {
      if (error.response?.status === 401) {
        setEventError('Please log in to view events');
      } else if (error.response?.status === 404) {
        setEventError('No event registrations found');
        setEvents([]);
      } else {
        setEventError(error.response?.data?.message || 'Failed to fetch events');
      }
      console.error('Fetch events error:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleCancelWithRefund = async (appointmentId) => {
    const reason = window.prompt('Please enter reason for cancellation and refund request (min 10 characters):');
    if (!reason || reason.trim().length < 10) {
      alert('Refund reason is required and must be at least 10 characters');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this appointment and request a refund?')) {
      return;
    }

    setIsCancelling(true);

    try {
      const response = await api.patch(`/appointments/${appointmentId}/cancel-with-refund`, {
        refundReason: reason,
      });

      const { data } = response.data;
      alert(`Success! Your refund request for BDT${data.refundRequest.netAmount.toFixed(2)} has been submitted.`);
      fetchAppointments();
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || 'Failed to process cancellation'}`);
      console.error('Cancellation error:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelWithoutRefund = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment without a refund?')) {
      return;
    }

    setIsCancelling(true);

    try {
      await api.patch(`/appointments/${appointmentId}/cancel`);
      alert('Appointment cancelled successfully');
      fetchAppointments();
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || 'Failed to cancel appointment'}`);
      console.error('Cancellation error:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const toggleAppointmentSection = () => {
    setShowAppointmentSection(!showAppointmentSection);
    if (!showAppointmentSection) {
      fetchAppointments();
    } else {
      setAppointments([]);
      setSearchError('');
    }
  };

  const toggleAdoptionSection = () => {
    setShowAdoptionSection(!showAdoptionSection);
    if (!showAdoptionSection) {
      fetchAdoptions();
    } else {
      setAdoptions([]);
      setAdoptionError('');
    }
  };

  const toggleProductSection = () => {
    setShowProductSection(!showProductSection);
    if (!showProductSection) {
      fetchProducts();
    } else {
      setProducts([]);
      setProductError('');
    }
  };

  const toggleEventSection = () => {
    setShowEventSection(!showEventSection);
    if (!showEventSection) {
      fetchEvents();
    } else {
      setEvents([]);
      setEventError('');
    }
  };

  const togglePrescriptionSection = () => {
    setShowPrescriptionSection(!showPrescriptionSection);
  };

  const handleLogout = () => {
    // Clear pet owner-specific keys
    localStorage.removeItem("petOwnerToken");
    localStorage.removeItem("petOwnerUser");
    navigate("/"); // Redirect to home page
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const createPdfLines = (report) => {
    const lines = [
      `${report.type || 'Medical Report'} for: ${report.petName || 'Unknown Pet'}`,
      `Date: ${report.date ? formatDate(report.date) : 'N/A'}`,
      `Type: ${report.type || 'N/A'}`,
      '',
    ];

    if (report.type === 'Prescription') {
      lines.push(`Doctor: ${report.prescription?.doctor || 'N/A'}`);
      lines.push(`Follow-up: ${report.prescription?.followUpDate ? formatDate(report.prescription.followUpDate) : 'Not scheduled'}`);
      lines.push('', 'Medicines:');
      if (report.prescription?.medicines?.length > 0) {
        report.prescription.medicines.forEach((med, index) => {
          lines.push(`  ${index + 1}. ${med.name || 'N/A'} (${med.dosage || 'N/A'}) - ${med.frequency || 'N/A'}`);
          if (med.instructions) {
            lines.push(`     Instructions: ${med.instructions}`);
          }
        });
      } else {
        lines.push('  No medicines listed');
      }
      if (report.prescription?.advice) {
        lines.push('', `Advice: ${report.prescription.advice}`);
      }
    } else if (report.type === 'Medical') {
      lines.push(`Diagnosis: ${report.diagnosis || 'N/A'}`);
      lines.push(`Treatment: ${report.treatment || 'N/A'}`);
    } else if (report.type === 'Vaccination') {
      lines.push(`Description: ${report.description || 'N/A'}`);
      lines.push(`Doctor ID: ${report.doctorId || 'N/A'}`);
    } else if (report.type === 'Grooming') {
      lines.push(`Service: ${report.groomingService || 'N/A'}`);
      lines.push(`Notes: ${report.groomerNotes || 'N/A'}`);
    } else if (report.type === 'Training') {
      lines.push(`Focus: ${report.trainingFocus || 'N/A'}`);
      lines.push(`Notes: ${report.trainerNotes || 'N/A'}`);
    } else {
      Object.entries(report).forEach(([key, value]) => {
        if (!['type', 'date', 'petName', 'petId', '_id', 'prescription'].includes(key) && value) {
          lines.push(`${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
        }
      });
    }

    return lines;
  };

  const downloadPrescriptionPdf = (report) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFontSize(18);
    doc.setTextColor('#B3714E');
    doc.text(`${report.type || 'Vet Report'}`, 40, 50);

    doc.setFontSize(12);
    doc.setTextColor('#1f2937');
    const lines = createPdfLines(report);
    const splitLines = lines.flatMap(line => doc.splitTextToSize(line, 520));
    doc.text(splitLines, 40, 85);

    const filename = `report_${(report.type || 'report').replace(/\s+/g, '_').toLowerCase()}_${(report.petName || 'pet').replace(/\s+/g, '_')}_${new Date(report.date || Date.now()).toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  };

  const downloadAllPrescriptionsPdf = () => {
    if (!reports.length) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    reports.forEach((report, index) => {
      if (index > 0) {
        doc.addPage();
      }

      doc.setFontSize(18);
      doc.setTextColor('#B3714E');
      doc.text(`${report.type || 'Vet Report'} ${index + 1}`, 40, 50);

      doc.setFontSize(12);
      doc.setTextColor('#1f2937');
      const lines = createPdfLines(report);
      const splitLines = lines.flatMap(line => doc.splitTextToSize(line, 520));
      doc.text(splitLines, 40, 85);
    });

    doc.save(`all_vet_reports_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Placeholder images
  const defaultPetImage = "https://via.placeholder.com/150?text=Pet+Image";
  const addPetImage = "https://via.placeholder.com/150?text=Add+Pet";

  return (
<div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#F8E9D8] to-[#F5EFEA] py-10 px-4 sm:px-6 lg:px-8">      <div className="max-w-7xl mx-auto space-y-8">
        {/* Modern Profile Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-[2rem] overflow-hidden border border-white/70">
          {isLoading && !user ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className="text-amber-800 text-lg font-medium">Loading your profile...</p>
            </div>
          ) : userError ? (
            <div className="text-center py-16">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mx-6">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <p className="text-red-600 font-medium text-lg">{userError}</p>
              </div>
            </div>
          ) : user ? (
            <>
              {/* Hero Header */}
<div className="relative bg-gradient-to-r from-[#B3704D] via-[#D08860] to-[#E6A77C] p-8 lg:p-12 text-white overflow-hidden shadow-inner shadow-[#B3704D]/30">                <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-5 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white bg-opacity-5 rounded-full translate-y-24 -translate-x-24"></div>
                <div className="relative flex flex-col lg:flex-row items-center justify-between">
                  <div className="flex flex-col sm:flex-row items-center mb-6 lg:mb-0 text-center lg:text-left">

                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold mb-2">{user.name}</h1>
                      <p className="text-amber-100 text-lg lg:text-xl mb-1">{user.membership} Member</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/UserEdit">
                      <button className="bg-[#D08860] hover:bg-[#B3714E] text-white px-8 py-4 rounded-2xl transition-all duration-300 flex items-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                        <Edit className="mr-3" size={20} />
                        <span className="font-semibold">Edit Profile</span>
                      </button>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                    >
                      <span className="font-semibold">Log Out</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="p-8 lg:p-12">
                <div className="space-y-12">
                  {/* Contact Information */}
                  <section>
                    <div className="mb-8 pb-4 border-b-3 border-amber-200">
                      <h2 className="text-3xl lg:text-4xl font-bold text-amber-900 flex items-center">
                        <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-3 rounded-2xl mr-4 shadow-lg">
                          <User className="text-amber-700" size={28} />
                        </div>
                        <span>Contact Information</span>
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Email Card */}
                      <div className="group bg-white/75 backdrop-blur-sm p-6 rounded-3xl border border-amber-100 hover:border-[#D08860]/40 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex flex-col h-full">
                          <div className="flex items-center mb-4">
                            <div className="bg-white p-3 rounded-xl mr-3 shadow-md group-hover:shadow-lg transition-all">
                              <Mail className="text-amber-700" size={22} />
                            </div>
                            <h3 className="font-bold text-amber-900 text-sm uppercase tracking-wider">Email Address</h3>
                          </div>
                          <p className="text-amber-800 text-base font-semibold break-all mt-auto">{user.email}</p>
                        </div>
                      </div>
                      
                      {/* Phone Card */}
                      <div className="group bg-white/75 backdrop-blur-sm p-6 rounded-3xl border border-amber-100 hover:border-[#D08860]/40 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex flex-col h-full">
                          <div className="flex items-center mb-4">
                            <div className="bg-white p-3 rounded-xl mr-3 shadow-md group-hover:shadow-lg transition-all">
                              <Phone className="text-amber-700" size={22} />
                            </div>
                            <h3 className="font-bold text-amber-900 text-sm uppercase tracking-wider">Phone Number</h3>
                          </div>
                          <p className="text-amber-800 text-base font-semibold mt-auto">{user.phone}</p>
                        </div>
                      </div>
                      
                      {/* Location Card */}
                      <div className="group bg-white/75 backdrop-blur-sm p-6 rounded-3xl border border-amber-100 hover:border-[#D08860]/40 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex flex-col h-full">
                          <div className="flex items-center mb-4">
                            <div className="bg-white p-3 rounded-xl mr-3 shadow-md group-hover:shadow-lg transition-all">
                              <MapPin className="text-amber-700" size={22} />
                            </div>
                            <h3 className="font-bold text-amber-900 text-sm uppercase tracking-wider">Location</h3>
                          </div>
                          <p className="text-amber-800 text-base font-semibold mt-auto">{user.address}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* My Pets Section */}
                  <section className="mt-12">
                    <div className="mb-8 pb-4 border-b-3 border-amber-200">
                      <h2 className="text-3xl lg:text-4xl font-bold text-amber-900 flex items-center">
                        <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-3 rounded-2xl mr-4 shadow-lg">
                          <PawPrint className="text-amber-700" size={28} />
                        </div>
                        <span>My Pets</span>
                      </h2>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm p-8 rounded-[2rem] border border-amber-100 shadow-lg">
                      {isLoadingPets ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                          <p className="text-amber-700 font-medium text-lg">Loading your pets...</p>
                        </div>
                      ) : petsError || pets.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-7xl mb-4 opacity-80">🐾</div>
                          <p className="text-amber-700 font-medium text-lg mb-8">No pets added yet</p>
                          <Link to="/PetRegister">
                            <button className="bg-gradient-to-r from-[#D08860] to-[#B3714E] hover:from-[#B3714E] hover:to-[#9a6548] text-white px-8 py-4 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1 mx-auto">
                              <PawPrint className="mr-3" size={20} />
                              <span className="font-semibold">Add Your First Pet</span>
                            </button>
                          </Link>
                        </div>
                      ) : (
                        <div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {pets.map((pet) => (
                              <Link key={pet._id} to={`/PetEdit/${pet._id}`}>
                                <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-5 transform hover:-translate-y-2 cursor-pointer border border-amber-100 hover:border-amber-300">
                                  <div className="flex justify-center mb-4">
                                    <img
                                      src={pet.petimage || defaultPetImage}
                                      alt={pet.name}
                                      className="w-20 h-20 rounded-full border-4 border-amber-300 object-cover shadow-lg group-hover:border-amber-500 transition-all"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = defaultPetImage;
                                      }}
                                    />
                                  </div>
                                  <div className="text-center">
                                    <p className="font-bold text-amber-900 text-lg mb-1">{pet.name}</p>
                                    <p className="text-amber-700 text-sm">{pet.breed || 'Unknown breed'}</p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                          <div className="pt-6 border-t-2 border-amber-200">
                            <Link to="/PetRegister" className="block">
                              <button className="w-full bg-white hover:bg-amber-50 text-amber-800 border-2 border-amber-200 px-6 py-4 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg font-semibold">
                                <PawPrint className="mr-3" size={20} />
                                Add Another Pet
                              </button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-8 mx-6">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-amber-700 font-medium text-lg">No profile data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Activity Dashboard */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
          {/* Appointments Card */}
          <div className="bg-white/80 backdrop-blur-md shadow-lg rounded-[2rem] overflow-hidden border border-white/70 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
            <div className="p-8 flex-1 flex flex-col">
              <div className="text-center mb-8">
                <button
                  onClick={toggleAppointmentSection}
                  className="bg-gradient-to-r from-[#D08860] to-[#B3714E] hover:from-[#B3714E] hover:to-[#9a6548] text-white px-8 py-5 rounded-2xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center shadow-xl transform hover:-translate-y-1 w-full"
                >
                  <Calendar className="mr-3" size={24} />
                  <span className="font-bold text-lg">
                    {showAppointmentSection ? 'Hide Appointments' : 'View Appointments'}
                  </span>
                  {showAppointmentSection ? (
                    <ChevronUp className="ml-3" size={24} />
                  ) : (
                    <ChevronDown className="ml-3" size={24} />
                  )}
                </button>
              </div>
              {showAppointmentSection && (
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 border border-amber-200 shadow-inner">
                  <h3 className="text-2xl font-bold text-amber-900 mb-6 flex items-center justify-center">
                    <Clock className="mr-3 text-amber-600" size={28} />
                    Active Appointments
                  </h3>
                  {searchError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                      <p className="text-red-600 text-center font-medium">{searchError}</p>
                    </div>
                  )}
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                      <p className="text-amber-700 font-medium text-lg">Loading appointments...</p>
                    </div>
                  ) : appointments.length > 0 ? (
                    <div className="space-y-6 max-h-[30rem] overflow-y-auto">
                      {appointments.map((appointment) => (
                        <div
                          key={appointment._id}
                          className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-100 transform hover:-translate-y-1"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-xl text-amber-900 mb-1">
                                {appointment.appointmentType} Appointment
                              </h4>
                              <p className="text-amber-700 text-sm">ID: {appointment._id.slice(-6)}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                              appointment.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : (appointment.status === 'cancelled' || appointment.status === 'rejected') && appointment.paymentStatus === 'refunded'
                                ? 'bg-blue-100 text-blue-800'
                                : appointment.status === 'cancelled' || appointment.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-200 text-amber-800'
                            }`}>
                              {(appointment.status === 'cancelled' || appointment.status === 'rejected') && appointment.paymentStatus === 'refunded'
                                ? 'Refunded'
                                : appointment.status}
                            </span>
                          </div>
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center text-amber-700">
                              <Calendar className="mr-3 text-amber-600" size={18} />
                              <span className="font-medium">
                                {formatDate(appointment.appointmentDate)} at {formatTime(appointment.appointmentTime)}
                              </span>
                            </div>
                            <div className="flex items-center text-amber-700">
                              <button
onClick={() => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  }}
  className="px-4 py-2 bg-amber-200 rounded-lg mt-3"
>
  View Details
</button>
                              <FileText className="mr-3 text-amber-600" size={18} />
                              <span className="font-medium">Fee: ৳{appointment.appointmentFee}</span>
                            </div>
                          </div>
                          {['scheduled', 'approved'].includes(appointment.status?.toLowerCase()) && (
                            <div className="pt-4 border-t border-amber-200">
                              <div className="flex flex-col gap-3">
                                <button
                                  onClick={() => handleCancelWithRefund(appointment._id)}
                                  disabled={isCancelling}
                                  className="px-6 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all duration-300 text-sm font-medium disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                                >
                                  {isCancelling ? 'Processing...' : 'Cancel & Request Refund'}
                                </button>
                                <button
                                  onClick={() => handleCancelWithoutRefund(appointment._id)}
                                  disabled={isCancelling}
                                  className="px-6 py-3 bg-amber-100 text-amber-800 rounded-xl hover:bg-amber-200 transition-all duration-300 text-sm font-medium disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                                >
                                  {isCancelling ? 'Processing...' : 'Cancel Without Refund'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-amber-700">
                      <div className="text-6xl mb-4">📅</div>
                      <p className="font-medium text-lg">No active appointments</p>
                    </div>
                  )}
                  {showAppointmentDetails && selectedAppointment && (
  <div className="mt-6 bg-white p-6 rounded-2xl shadow-lg border border-amber-200">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-bold text-amber-900">
        Appointment Details
      </h3>

      <button
        onClick={() => setShowAppointmentDetails(false)}
        className="text-red-500 font-bold"
      >
        Close
      </button>
    </div>

    <p><b>Type:</b> {selectedAppointment.appointmentType}</p>
    <p><b>Date:</b> {formatDate(selectedAppointment.appointmentDate)}</p>
    <p><b>Time:</b> {formatTime(selectedAppointment.appointmentTime)}</p>
    <p><b>Fee:</b> ৳{selectedAppointment.appointmentFee}</p>
    <p><b>Status:</b> {selectedAppointment.status}</p>
  </div>
)}
                </div>
              )}
            </div>
          </div>

          {/* Adoptions Card */}
          <div className="bg-white/80 backdrop-blur-md shadow-lg rounded-[2rem] overflow-hidden border border-white/70 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
            <div className="p-8 flex-1 flex flex-col">
              <div className="text-center mb-8">
                <button
                  onClick={toggleAdoptionSection}
                  className="bg-gradient-to-r from-[#D08860] to-[#B3714E] hover:from-[#B3714E] hover:to-[#9a6548] text-white px-8 py-5 rounded-2xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center shadow-xl transform hover:-translate-y-1 w-full"
                >
                  <PawPrint className="mr-3" size={24} />
                  <span className="font-bold text-lg">
                    {showAdoptionSection ? 'Hide Adoptions' : 'My Adoptions'}
                  </span>
                  {showAdoptionSection ? (
                    <ChevronUp className="ml-3" size={24} />
                  ) : (
                    <ChevronDown className="ml-3" size={24} />
                  )}
                </button>
              </div>
              {showAdoptionSection && (
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 border border-amber-200 shadow-inner">
                  <h3 className="text-2xl font-bold text-amber-900 mb-6 flex items-center justify-center">
                    <PawPrint className="mr-3 text-amber-600" size={28} />
                    Adoption History
                  </h3>
                  {adoptionError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                      <p className="text-red-600 text-center font-medium">{adoptionError}</p>
                    </div>
                  )}
                  {isLoadingAdoptions ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                      <p className="text-amber-700 font-medium text-lg">Loading adoptions...</p>
                    </div>
                  ) : adoptions.length > 0 ? (
                    <div className="space-y-6 max-h-[30rem] overflow-y-auto">
                      {adoptions.map((adoption) => (
                        <div key={adoption._id} className="bg-white p-6 rounded-2xl shadow-lg border border-amber-100 transform hover:-translate-y-1 transition-all duration-300 hover:shadow-xl">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-xl text-amber-900 mb-1">
                                {adoption.petName || 'N/A'}
                              </h4>
                              <p className="text-amber-700">{adoption.petBreed || 'N/A'}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                              adoption.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-200 text-amber-800'
                            }`}>
                              {adoption.status || 'Pending'}
                            </span>
                          </div>
                          <div className="flex items-center text-amber-700">
                            <Calendar className="mr-3 text-amber-600" size={18} />
                            <span className="font-medium">
                              Adopted {formatDate(adoption.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-amber-700">
                      <div className="text-6xl mb-4">🏠</div>
                      <p className="font-medium text-lg">No adoption records</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Products Card */}
          <div className="bg-white/80 backdrop-blur-md shadow-lg rounded-[2rem] overflow-hidden border border-white/70 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
            <div className="p-8 flex-1 flex flex-col">
              <div className="text-center mb-8">
                <button
                  onClick={toggleProductSection}
                  className="bg-gradient-to-r from-[#D08860] to-[#B3714E] hover:from-[#B3714E] hover:to-[#9a6548] text-white px-8 py-5 rounded-2xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center shadow-xl transform hover:-translate-y-1 w-full"
                >
                  <ShoppingBag className="mr-3" size={24} />
                  <span className="font-bold text-lg">
                    {showProductSection ? 'Hide Products' : 'My Products'}
                  </span>
                  {showProductSection ? (
                    <ChevronUp className="ml-3" size={24} />
                  ) : (
                    <ChevronDown className="ml-3" size={24} />
                  )}
                </button>
              </div>
              {showProductSection && (
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 border border-amber-200 shadow-inner">
                  <h3 className="text-2xl font-bold text-amber-900 mb-6 flex items-center justify-center">
                    <ShoppingBag className="mr-3 text-amber-600" size={28} />
                    Purchased Products
                  </h3>
                  {productError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                      <p className="text-red-600 text-center font-medium">{productError}</p>
                    </div>
                  )}
                  {isLoadingProducts ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                      <p className="text-amber-700 font-medium text-lg">Loading orders...</p>
                    </div>
                  ) : products.length > 0 ? (
                    <div className="space-y-6 max-h-[30rem] overflow-y-auto">
                      {products.map((order) => (
                        <div
                          key={order._id}
                          className="bg-white p-6 rounded-2xl shadow-lg border border-amber-100 transform hover:-translate-y-1 transition-all duration-300 hover:shadow-xl"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-xl text-amber-900 mb-1">
                                Order #{order._id.slice(-6)}
                              </h4>
                              <p className="text-amber-700">{new Date(order.date).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                              order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'Shipped' ? 'bg-purple-100 text-purple-800' :
                              order.status === 'Out for Delivery' ? 'bg-indigo-100 text-indigo-800' :
                              order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-amber-200 text-amber-800'
                            }`}>
                              {order.status || 'Pending'}
                            </span>
                          </div>
                          <div className="space-y-4 mb-4">
                            {order.products.slice(0, 2).map((product, index) => (
                              <div key={index} className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl">
                                {product.image ? (
                                  <img src={product.image} alt={product.name} className="w-14 h-14 rounded-lg object-cover border border-amber-200 shadow-sm" />
                                ) : (
                                  <div className="w-14 h-14 bg-amber-100 rounded-lg flex items-center justify-center shadow-sm">
                                    <span className="text-amber-800 text-xs font-bold">IMG</span>
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="font-bold text-amber-900">{product.name}</p>
                                  <p className="text-amber-700 text-sm">৳{product.price} × {product.quantity}</p>
                                </div>
                              </div>
                            ))}
                            {order.products.length > 2 && (
                              <p className="text-amber-600 text-center font-medium">+{order.products.length - 2} more items</p>
                            )}
                          </div>
                          <div className="pt-4 border-t border-amber-200 flex justify-between items-center">
                            <span className="font-bold text-amber-900 text-lg">Total: ৳{order.totalPrice}</span>
                            <Link to="/orders">
                              <button className="bg-gradient-to-r from-[#D08860] to-[#B3714E] hover:from-[#B3714E] hover:to-[#9a6548] text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                                View All
                              </button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-amber-700">
                      <div className="text-6xl mb-4">🛒</div>
                      <p className="font-medium text-lg mb-4">No orders found</p>
                      <Link to="/collection" className="bg-gradient-to-r from-[#D08860] to-[#B3714E] hover:from-[#B3714E] hover:to-[#9a6548] text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-block">
                        <span className="font-semibold">Shop Now</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Vet Reports Card */}
          <div className="bg-white text-amber-900 shadow-2xl rounded-3xl overflow-hidden border border-amber-200 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 xl:col-span-2">
            <div className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-semibold mb-2 flex items-center text-amber-900">
                    <FileText className="mr-4 text-amber-600" size={28} />
                    Vet Reports
                  </h2>
                  <p className="text-amber-700 max-w-2xl">
                    View all vet-provided medical reports for your pets and download them as PDF summaries.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={togglePrescriptionSection}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200 transition-all duration-300"
                  >
                    {showPrescriptionSection ? 'Hide Reports' : 'Show Reports'}
                  </button>
                  <button
                    onClick={downloadAllPrescriptionsPdf}
                    disabled={reports.length === 0}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${reports.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#D08860] text-white hover:bg-[#B3714E]'}`}
                  >
                    <Download size={18} />
                    Download All PDFs
                  </button>
                </div>
              </div>
              {showPrescriptionSection && (
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl p-8 border border-amber-200 shadow-inner">
                  {reports.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 max-h-[38rem] overflow-y-auto">
                      {reports.map((report, index) => (
                        <div
                          key={index}
                          className="bg-white p-6 rounded-3xl border border-amber-100 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        >
                          <div className="flex justify-between items-start gap-4 mb-4">
                            <div>
                              <h4 className="font-semibold text-xl text-amber-900 mb-1">{report.petName || 'Pet Report'}</h4>
                              <p className="text-amber-600">{report.type || 'Report'} • {formatDate(report.date)}</p>
                              {report.type === 'Prescription' && report.prescription?.doctor && (
                                <p className="text-amber-600 text-sm">Doctor: {report.prescription.doctor}</p>
                              )}
                            </div>
                            <button
                              onClick={() => downloadPrescriptionPdf(report)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#D08860] text-white text-sm font-semibold hover:bg-[#B3714E] transition-all duration-300"
                            >
                              <Download size={16} />
                              PDF
                            </button>
                          </div>
                          <div className="space-y-4">
                            {report.type === 'Prescription' && (
                              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                <h5 className="font-semibold text-amber-700 mb-3">Medicines</h5>
                                {report.prescription?.medicines?.length > 0 ? (
                                  <ul className="space-y-3">
                                    {report.prescription.medicines.map((med, medIndex) => (
                                      <li key={medIndex} className="bg-white p-3 rounded-2xl border border-amber-100">
                                        <p className="font-semibold text-amber-900">{med.name || 'N/A'}</p>
                                        <p className="text-amber-600 text-sm">{med.dosage || 'N/A'} • {med.frequency || 'N/A'}</p>
                                        {med.instructions && <p className="text-amber-700 text-xs mt-1">{med.instructions}</p>}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-amber-600">No medicines listed</p>
                                )}
                              </div>
                            )}
                            {report.type === 'Medical' && (
                              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                <h5 className="font-semibold text-amber-700 mb-3">Medical Summary</h5>
                                <p className="text-amber-600"><span className="font-semibold">Diagnosis:</span> {report.diagnosis || 'N/A'}</p>
                                <p className="text-amber-600"><span className="font-semibold">Treatment:</span> {report.treatment || 'N/A'}</p>
                              </div>
                            )}
                            {report.type === 'Vaccination' && (
                              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                <h5 className="font-semibold text-amber-700 mb-3">Vaccination Details</h5>
                                <p className="text-amber-600"><span className="font-semibold">Description:</span> {report.description || 'N/A'}</p>
                                <p className="text-amber-600"><span className="font-semibold">Doctor ID:</span> {report.doctorId || 'N/A'}</p>
                              </div>
                            )}
                            {report.type === 'Grooming' && (
                              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                <h5 className="font-semibold text-amber-700 mb-3">Grooming Summary</h5>
                                <p className="text-amber-600"><span className="font-semibold">Service:</span> {report.groomingService || 'N/A'}</p>
                                <p className="text-amber-600"><span className="font-semibold">Notes:</span> {report.groomerNotes || 'N/A'}</p>
                              </div>
                            )}
                            {report.type === 'Training' && (
                              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                <h5 className="font-semibold text-amber-700 mb-3">Training Summary</h5>
                                <p className="text-amber-600"><span className="font-semibold">Focus:</span> {report.trainingFocus || 'N/A'}</p>
                                <p className="text-amber-600"><span className="font-semibold">Notes:</span> {report.trainerNotes || 'N/A'}</p>
                              </div>
                            )}
                            {!['Prescription', 'Medical', 'Vaccination', 'Grooming', 'Training'].includes(report.type) && (
                              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                <h5 className="font-semibold text-amber-700 mb-3">Report Details</h5>
                                <pre className="text-amber-600 text-sm whitespace-pre-wrap break-words">{JSON.stringify(report, null, 2)}</pre>
                              </div>
                            )}
                            {report.type === 'Prescription' && report.prescription?.followUpDate && (
                              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                <p className="text-amber-900 font-semibold">Follow-up</p>
                                <p className="text-amber-600">{formatDate(report.prescription.followUpDate)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-amber-700">
                      <div className="text-6xl mb-4">💊</div>
                      <p className="font-medium text-lg">No reports found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;