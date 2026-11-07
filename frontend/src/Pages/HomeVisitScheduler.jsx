import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Calendar, Phone, MapPin, User, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://pet-care-backend-422z.onrender.com/api';

const AdoptionScheduler = () => {
  const [adoptionForms, setAdoptionForms] = useState([]);
  const [homeVisits, setHomeVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchScheduledVisits();
  }, []);

  const fetchScheduledVisits = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('petOwnerToken');
      
      // Fetch adoption forms with approved_for_home_visit status
      const formsResponse = await fetch(
        `${API_URL}/adoptionform/my-applications`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!formsResponse.ok) throw new Error('Failed to fetch forms');
      const formsData = await formsResponse.json();

      // Filter only approved_for_home_visit forms
      const approvedForms = formsData.filter(form => form.status === 'approved_for_home_visit');
      setAdoptionForms(approvedForms);

      // Fetch home visits
      const visitsResponse = await fetch(
        `${API_URL}/homevisits/my-visits`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (visitsResponse.ok) {
        const visitsData = await visitsResponse.json();
        setHomeVisits(visitsData);
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
      showNotification('Error loading scheduled visits', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

const handleVisitResponse = async (visitId, response) => {
  try {
    const token = localStorage.getItem('petOwnerToken');

    const res = await fetch(
      `${API_URL}/homevisits/${visitId}/respond`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userResponse: response,
          response: response
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to update response');
    }

    showNotification(
      `Home visit ${response === 'accepted' ? 'accepted' : 'rejected'} successfully!`,
      'success'
    );

    fetchScheduledVisits();
  } catch (error) {
    console.error('Error updating visit response:', error);
    showNotification(error.message || 'Error updating visit response', 'error');
  }
};

  const getRelatedVisit = (form) => {
    const formId = String(form._id);
    const formEmail = String(form.email || '').trim().toLowerCase();
    const formPetName = String(form.petName || '').trim().toLowerCase();

    return homeVisits.find(visit => {
      const visitFormId = visit.adoptionFormId?._id || visit.adoptionFormId?.id || visit.adoptionFormId;
      const matchesFormId = visitFormId ? String(visitFormId) === formId : false;
      const matchesEmailAndPet = String(visit.adopterEmail || '').trim().toLowerCase() === formEmail
        && String(visit.petName || '').trim().toLowerCase() === formPetName;
      return matchesFormId || matchesEmailAndPet;
    });
  };

  const formatTimeWithAmPm = (timeString) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4E4D8] to-[#E6D5C1] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-4 rounded-lg flex items-center ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle size={20} className="mr-2" />
            ) : (
              <AlertCircle size={20} className="mr-2" />
            )}
            {notification.message}
          </div>
        )}

        {/* Header */}
        <header className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Home Visit Schedules</h1>
          <p className="text-gray-600">View and approve your scheduled home visits</p>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600">Loading scheduled visits...</p>
          </div>
        )}

        {/* No Visits State */}
        {!loading && adoptionForms.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600">No scheduled home visits at this time</p>
          </div>
        )}

        {/* Scheduled Visits List */}
        {!loading && adoptionForms.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">Scheduled for Home Visit</h2>
              <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium">
                {adoptionForms.length} Pending
              </span>
            </div>

            {adoptionForms.map(form => {
              const relatedVisit = getRelatedVisit(form._id);
              const visitDate = relatedVisit?.date ? new Date(relatedVisit.date) : null;
              const isPending = !relatedVisit?.userResponse || relatedVisit.userResponse.toString().toLowerCase() === 'pending';

              return (
                <div 
                  key={form._id}
                  className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left - Pet Image and Basic Info */}
                    <div>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {form.petImage ? (
                            <img
                              src={form.petImage.startsWith('http') ? form.petImage : `https://pet-care-backend-422z.onrender.com${form.petImage}`}
                              alt={form.petName}
                              className="w-24 h-24 rounded-lg object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/96?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-400">No Image</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-grow">
                          <h3 className="text-xl font-bold text-[#80533b] mb-2">{form.petName}</h3>
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium inline-block">
                            Scheduled for Visit
                          </span>
                        </div>
                      </div>

                      {/* Adoption Form Details */}
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-[#D08860]" />
                          <span className="font-semibold">Applicant:</span>
                          <span>{form.firstName} {form.lastName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-[#D08860]" />
                          <span className="font-semibold">Phone:</span>
                          <span>{form.phoneNumber}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-[#D08860] mt-1" />
                          <div>
                            <span className="font-semibold">Home Type:</span>
                            <span className="ml-1">{form.homeType}</span>
                          </div>
                        </div>
                      </div>

                      {/* Adoption Details */}
                      <div className="mt-4 bg-gray-50 rounded p-3 text-sm space-y-1">
                        <div><span className="font-semibold">Pet Type:</span> {form.petType}</div>
                        <div><span className="font-semibold">Has Yard:</span> {form.hasYard ? 'Yes' : 'No'}</div>
                        <div><span className="font-semibold">Other Pets:</span> {form.hasOtherPets ? 'Yes' : 'No'}</div>
                        <div><span className="font-semibold">Employment:</span> {form.employmentStatus}</div>
                      </div>
                    </div>

                    {/* Right - Visit Details and Actions */}
                    <div>
                      {relatedVisit ? (
                        <>
                          {/* Visit Details */}
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <h4 className="font-bold text-green-800 mb-3 flex items-center">
                              <Calendar size={18} className="mr-2" />
                              Home Visit Scheduled
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-semibold text-gray-700">📅 Date:</span>
                                <span className="ml-2 text-gray-900 font-medium">
                                  {visitDate?.toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-700">🕐 Time:</span>
                                <span className="ml-2 text-gray-900 font-medium">
                                  {visitDate ? formatTimeWithAmPm(visitDate.toTimeString().slice(0, 5)) : 'N/A'}
                                </span>
                              </div>
                              {relatedVisit.notes && (
                                <div className="mt-2">
                                  <span className="font-semibold text-gray-700">Notes:</span>
                                  <p className="text-gray-600 mt-1">{relatedVisit.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* User Response Status */}
                          {isPending ? (
                            <div className="space-y-3">
                              <p className="text-sm text-gray-600 mb-3">Do you accept this home visit schedule?</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleVisitResponse(relatedVisit._id, 'accepted')}
                                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                                >
                                  <CheckCircle size={18} />
                                  Approve Visit
                                </button>
                                <button
                                  onClick={() => handleVisitResponse(relatedVisit._id, 'rejected')}
                                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                                >
                                  <XCircle size={18} />
                                  Reject Visit
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className={`p-3 rounded-lg text-center font-medium ${
                              relatedVisit.userResponse === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {relatedVisit.userResponse === 'accepted' ? '✓ Visit Accepted' : '✗ Visit Rejected'}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <p className="text-amber-800 text-sm">
                            <AlertCircle size={16} className="inline mr-2" />
                            Waiting for coordinator to schedule visit details
                          </p>
                        </div>
                      )}

                      {/* Additional Info */}
                      {form.additionalInfo && (
                        <div className="mt-4 bg-blue-50 rounded p-3 text-sm">
                          <span className="font-semibold text-blue-900">Additional Info:</span>
                          <p className="text-blue-800 mt-1">{form.additionalInfo}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdoptionScheduler;