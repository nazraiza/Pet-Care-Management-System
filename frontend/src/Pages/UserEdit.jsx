import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Heart, X, ZoomIn, ZoomOut, Move } from 'lucide-react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const UserEdit = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    city: ''
    });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('petOwnerToken');
        const response = await axios.get('https://pet-care-backend-422z.onrender.com/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFormData({
          name: response.data.name,
          email: response.data.email,
          phoneNumber: response.data.phoneNumber,
          city: response.data.city
        });
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching profile');
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('petOwnerToken');
      const formDataToSend = new FormData();
      
      // Append all form fields to FormData
Object.keys(formData).forEach(key => {
  formDataToSend.append(key, formData[key]); // only remaining fields: name, email, phoneNumber, city
});

      const response = await axios.put('https://pet-care-backend-422z.onrender.com/api/users/updateProfile', formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.user) {
        // Update local storage with new user data
        localStorage.setItem('petOwnerToken', response.data.token);
        localStorage.setItem('petOwnerUser', JSON.stringify({
          _id: response.data.user._id,
          name: response.data.user.name,
          email: response.data.user.email,
          phoneNumber: response.data.user.phoneNumber,
          city: response.data.user.city        }));
        navigate('/profile');
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.message || 'Error updating profile. Please try again.');
    }
  };

  const handleDeleteProfile = async () => {
    try {
      const token = localStorage.getItem('petOwnerToken');
      const response = await axios.post('https://pet-care-backend-422z.onrender.com/api/users/deleteProfile', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.message === 'Profile and associated data deleted successfully') {
        localStorage.removeItem('petOwnerToken');
        localStorage.removeItem('petOwnerUser');
        navigate('/');
      } else {
        setError('Failed to delete profile');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Error deleting profile. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4E4D8] to-[#E6D5C1] flex items-center justify-center p-6 sm:p-12 mt-12">
      <div className="w-full max-w-[800px] bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 relative h-64 md:h-auto">
          <div className="absolute inset-0 bg-[url('./assets/editprofile.jpg')] bg-cover bg-center flex items-start justify-center pt-4">
            <div className="text-white text-center p-6">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Edit Your Profile</h2>
              <p className="text-lg sm:text-xl">Update your details to continue your journey</p>
            </div>
          </div>
        </div>


        <div className="w-full md:w-1/2 p-6 sm:p-12">
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <Heart className="text-amber-950 mr-3" size={32} />
            <h2 className="text-2xl sm:text-3xl font-bold text-amber-950">Edit Profile</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm sm:text-md font-medium text-amber-950 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 rounded-lg border border-amber-200 text-gray-900 bg-white focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700 ${
                  error.includes('name') ? 'border-red-500' : 'border-amber-200'
                }`}
                placeholder="Your Name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm sm:text-md font-medium text-amber-950 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 rounded-lg border border-amber-200 text-gray-900 bg-white focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700 ${
                  error.includes('email') ? 'border-red-500' : 'border-amber-200'
                }`}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm sm:text-md font-medium text-amber-950 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                pattern="^01[3-9]\d{8}$"
                title="Phone number must be a 11-digit number starting with 01"
                className={`w-full px-4 py-2 rounded-lg border border-amber-200 text-gray-900 bg-white focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700 ${
                  error.includes('phoneNumber') ? 'border-red-500' : 'border-amber-200'
                }`}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm sm:text-md font-medium text-amber-950 mb-2">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 rounded-lg border border-amber-200 text-gray-900 bg-white focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700 ${
                  error.includes('city') ? 'border-red-500' : 'border-amber-200'
                }`}
                placeholder="Your City"
              />
            </div>

            {error && !error.includes('name') && !error.includes('email') && !error.includes('phoneNumber') && !error.includes('city') && (
              <p className="text-center text-sm text-red-500 flex items-center justify-center">
                <AlertCircle className="mr-2" size={18} /> {error}
              </p>
            )}

            <div className="flex flex-col space-y-4 pt-4">
              <button
                type="submit"
                className="w-full bg-amber-700 text-white px-8 py-3 sm:py-4 rounded-lg text-md sm:text-lg font-semibold hover:bg-amber-800 transition-colors"
              >
                Update Profile
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-600 text-white px-8 py-3 sm:py-4 rounded-lg text-md sm:text-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Delete Profile
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[550px] border border-amber-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-amber-700"
            >
              <X size={24} />
            </button>
            <div className="flex items-center justify-center mb-6">
              <Heart className="text-amber-950 mr-2" size={30} />
              <h3 className="text-xl sm:text-2xl font-bold text-amber-950">Confirm Deletion</h3>
            </div>
            <p className="text-gray-900 mb-6 text-center">
              Are you sure you want to delete your profile? This action cannot be undone and will permanently delete all your data.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-3 bg-gray-300 text-gray-900 rounded-lg text-md font-semibold hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProfile}
                className="px-6 py-3 bg-amber-700 text-white rounded-lg text-md font-semibold hover:bg-amber-800 transition-colors"
              >
                Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default UserEdit;