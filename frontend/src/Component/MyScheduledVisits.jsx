import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, CalendarCheck } from 'lucide-react';

const MyScheduledVisits = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch user's scheduled visits
  const fetchVisits = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('petOwnerToken');
      const response = await axios.get('http://localhost:5003/api/homevisits/my-visits', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisits(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load scheduled visits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  // Handle user response
  const handleRespond = async (visitId, response) => {
    try {
      const token = localStorage.getItem('petOwnerToken');
      await axios.patch(
        `http://localhost:5003/api/homevisits/${visitId}/respond`,
        { userResponse: response },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchVisits(); // Refresh list
    } catch (err) {
      console.error(err);
      alert('Failed to submit response.');
    }
  };

  if (loading) return <div className="p-6">Loading scheduled visits...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const pendingVisits = visits.filter(v => v.status === 'scheduled' && v.userResponse === 'pending');

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Your Scheduled Home Visits</h2>
      {pendingVisits.length === 0 ? (
        <p>No scheduled visits requiring your approval.</p>
      ) : (
        pendingVisits.map(visit => (
          <div key={visit._id} className="bg-white p-4 rounded-lg shadow-md mb-4 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold">{visit.petName} Adoption</h3>
              <p>
                Scheduled Date: {new Date(visit.date).toLocaleDateString()} {visit.startTime ? `• ${visit.startTime}` : ''}
              </p>
              <p>Adoption Manager: {visit.adopterName}</p>
            </div>
            <div className="flex space-x-2 mt-2 md:mt-0">
              <button
                onClick={() => handleRespond(visit._id, 'accepted')}
                className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
              >
                <CheckCircle className="mr-2" /> Approve
              </button>
              <button
                onClick={() => handleRespond(visit._id, 'rejected')}
                className="flex items-center bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                <XCircle className="mr-2" /> Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MyScheduledVisits;