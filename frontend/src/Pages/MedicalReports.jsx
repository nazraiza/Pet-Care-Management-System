import React, { useEffect, useState } from 'react';
import { FileText, Download, Eye, Calendar, User, Stethoscope } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const MedicalReports = () => {
const [reports, setReports] = useState([]);
const [loading, setLoading] = useState(true);
const [filter, setFilter] = useState('all'); // all, medical, grooming, training, prescription
const [timeFilter, setTimeFilter] = useState('all'); // all, weekly, monthly, yearly
const [selectedUser, setSelectedUser] = useState(null); // all, medical, grooming, training, prescription

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('https://pet-care-backend-422z.onrender.com/api/admins/medical-reports', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setReports(response.data.reports);
      } else {
        toast.error('Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

const filteredReports = reports.filter(report => {
  const reportType = report.type?.toLowerCase();

  const matchesType =
    filter === 'all' || reportType === filter;

  const reportDate = new Date(report.createdAt || report.date);
  const today = new Date();

  let matchesTime = true;

  if (timeFilter === 'weekly') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    matchesTime = reportDate >= sevenDaysAgo && reportDate <= today;
  }

  if (timeFilter === 'monthly') {
    matchesTime =
      reportDate.getMonth() === today.getMonth() &&
      reportDate.getFullYear() === today.getFullYear();
  }

  if (timeFilter === 'yearly') {
    matchesTime =
      reportDate.getFullYear() === today.getFullYear();
  }

  return matchesType && matchesTime;
});
  const groupedReports = filteredReports.reduce((acc, report) => {
  const userKey = report.userId || "unknown-user";

  if (!acc[userKey]) {
    acc[userKey] = {
      userId: report.userId,
      userName: report.userName || "Unknown User",
      userEmail: report.userEmail || "",
      userPhoneNumber: report.userPhoneNumber || "",
      userCity: report.userCity || "",
      pets: {}
    };
  }

  const petKey = report.petId || report.petName || "unknown-pet";

  if (!acc[userKey].pets[petKey]) {
    acc[userKey].pets[petKey] = {
      petId: report.petId,
      petName: report.petName || "Unknown Pet",
      petSpecies: report.petSpecies || "",
      petBreed: report.petBreed || "",
      reports: []
    };
  }

  acc[userKey].pets[petKey].reports.push(report);

  return acc;
}, {});

  const getReportIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'medical': return <Stethoscope className="text-red-500" size={20} />;
      case 'grooming': return <User className="text-blue-500" size={20} />;
      case 'training': return <User className="text-green-500" size={20} />;
      case 'prescription': return <FileText className="text-purple-500" size={20} />;
      default: return <FileText className="text-gray-500" size={20} />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F4E4D8] to-[#E6D5C1] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D88C6D]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4E4D8] to-[#E6D5C1]">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-[#4E2D21]">Medical Reports</h1>
<div className="flex items-center space-x-4">
  <select
    value={filter}
    onChange={(e) => {
      setFilter(e.target.value);
      setSelectedUser(null);
    }}
    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D88C6D]"
  >
    <option value="all">All Reports</option>
    <option value="medical">Medical</option>
    <option value="grooming">Grooming</option>
    <option value="training">Training</option>
    <option value="prescription">Prescription</option>
    <option value="vaccination">Vaccination</option>
  </select>

  <select
    value={timeFilter}
    onChange={(e) => {
      setTimeFilter(e.target.value);
      setSelectedUser(null);
    }}
    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D88C6D]"
  >
    <option value="all">All Time</option>
    <option value="weekly">This Week</option>
    <option value="monthly">This Month</option>
    <option value="yearly">This Year</option>
  </select>
</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-2xl rounded-3xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#4E2D21] mb-2">Veterinary Reports & Prescriptions</h2>
            <p className="text-gray-600">
  View reports organized by users, pets, report type, and time period
</p>
          </div>

{filteredReports.length === 0 ? (
  <div className="text-center py-12">
    <FileText className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
    <p className="mt-1 text-sm text-gray-500">No medical reports match the selected filter.</p>
  </div>
) : !selectedUser ? (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {Object.values(groupedReports).map((userGroup, index) => {
      const totalReports = Object.values(userGroup.pets).reduce(
        (total, petGroup) => total + petGroup.reports.length,
        0
      );

      return (
        <div
          key={index}
          onClick={() => setSelectedUser(userGroup)}
          className="bg-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#4E2D21]">
                {userGroup.userName}
              </h3>
              <p className="text-sm text-gray-600">
                {userGroup.userEmail || "No email found"}
              </p>
            </div>
            <User className="text-[#D88C6D]" size={24} />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Pets:</span> {Object.keys(userGroup.pets).length}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Reports:</span> {totalReports}
            </p>
            {userGroup.userPhoneNumber && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Phone:</span> {userGroup.userPhoneNumber}
              </p>
            )}
            {userGroup.userCity && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">City:</span> {userGroup.userCity}
              </p>
            )}
          </div>

          <button
            type="button"
            className="mt-5 w-full bg-[#D88C6D] text-white py-2 rounded-lg hover:bg-[#c97b5d] transition-colors"
          >
            View Reports
          </button>
        </div>
      );
    })}
  </div>
) : (
  <div>
    <button
      type="button"
      onClick={() => setSelectedUser(null)}
      className="mb-6 px-5 py-2 bg-[#4E2D21] text-white rounded-lg hover:bg-[#3b2118] transition-colors"
    >
      ← Back to Users
    </button>

    <div className="bg-[#F4E4D8] border border-[#E6D5C1] rounded-xl p-5 mb-6">
      <h3 className="text-2xl font-bold text-[#4E2D21]">
        {selectedUser.userName}
      </h3>
      <p className="text-gray-700">{selectedUser.userEmail}</p>
      {selectedUser.userPhoneNumber && (
        <p className="text-gray-700">{selectedUser.userPhoneNumber}</p>
      )}
      {selectedUser.userCity && (
        <p className="text-gray-700">{selectedUser.userCity}</p>
      )}
    </div>

    {Object.values(selectedUser.pets).map((petGroup, petIndex) => (
      <div key={petIndex} className="mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 shadow-sm">
          <h4 className="text-xl font-bold text-[#4E2D21]">
            Pet: {petGroup.petName}
          </h4>

          <div className="flex flex-wrap gap-4 mt-2">
            {petGroup.petSpecies && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Species:</span> {petGroup.petSpecies}
              </p>
            )}
            {petGroup.petBreed && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Breed:</span> {petGroup.petBreed}
              </p>
            )}
            <p className="text-sm text-gray-600">
              <span className="font-medium">Total Reports:</span> {petGroup.reports.length}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {petGroup.reports.map((report, index) => (
            <div
              key={report._id || index}
              className="bg-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getReportIcon(report.type)}
                  <span className="font-semibold text-[#4E2D21] capitalize">
                    {report.type}
                  </span>
                </div>
                <Calendar className="text-gray-400" size={16} />
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Pet:</span> {report.petName}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Owner:</span> {report.userName} ({report.userEmail})
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span> {formatDate(report.date)}
                </p>
              </div>

              <div className="space-y-2">
                {report.type === 'Medical' && (
                  <>
                    <p className="text-sm">
                      <span className="font-medium">Diagnosis:</span> {report.diagnosis}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Treatment:</span> {report.treatment}
                    </p>
                  </>
                )}

                {report.type === 'Grooming' && (
                  <>
                    <p className="text-sm">
                      <span className="font-medium">Service:</span> {report.groomingService}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Notes:</span> {report.groomerNotes}
                    </p>
                  </>
                )}

                {report.type === 'Training' && (
                  <>
                    <p className="text-sm">
                      <span className="font-medium">Focus:</span> {report.trainingFocus}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Notes:</span> {report.trainerNotes}
                    </p>
                  </>
                )}

                {report.type === 'Prescription' && (
                  <div>
                    <p className="text-sm font-medium mb-2">Medicines:</p>
                    {report.prescription?.medicines?.map((med, idx) => (
                      <div key={idx} className="text-xs bg-white p-2 rounded mb-1">
                        <p>
                          <span className="font-medium">Name:</span> {med.name}
                        </p>
                        <p>
                          <span className="font-medium">Dosage:</span> {med.dosage}
                        </p>
                        <p>
                          <span className="font-medium">Frequency:</span> {med.frequency}
                        </p>
                      </div>
                    ))}
                    <p className="text-sm mt-2">
                      <span className="font-medium">Advice:</span> {report.prescription?.advice}
                    </p>
                  </div>
                )}

                {report.type?.toLowerCase() === 'vaccination' && (
                  <>
                    <p className="text-sm">
                      <span className="font-medium">Description:</span> {report.description}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Doctor:</span> {report.doctorId}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
)}
        </div>
      </div>
    </div>
  );
};

export default MedicalReports;