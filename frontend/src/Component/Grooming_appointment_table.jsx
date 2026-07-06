import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, BellRing, ArrowRight } from 'lucide-react';

// Fallback API URL if environment variables are not available
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

const AppointmentGroomerTable = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const fetchGroomerAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${API_URL}/api/appointments/groomer-appointments`;
      const response = await fetch(url);
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}. Response: ${text}`);
      }

      const data = JSON.parse(text);
      const sortedData = data.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

      setAppointments(sortedData);
      setFilteredAppointments(sortedData);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Unable to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroomerAppointments();
  }, [fetchGroomerAppointments]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAppointments(appointments);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = appointments.filter((appointment) =>
      [appointment.userName, appointment.email, appointment.phoneNo, appointment.groomerId]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );

    setFilteredAppointments(filtered);
  }, [searchQuery, appointments]);

  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }, 3000);
  };

  const handleNotify = async (appointment) => {
    try {
      setActionLoading(appointment._id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showNotification(`Notified ${appointment.userName} at ${appointment.phoneNo}`, 'success');
    } catch (err) {
      console.error('Notify error:', err);
      showNotification('Failed to notify user', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleManage = async (appointment) => {
    try {
      setActionLoading(appointment._id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showNotification(`Opened manage panel for ${appointment.userName}`, 'success');
    } catch (err) {
      console.error('Manage error:', err);
      showNotification('Failed to manage appointment', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    return dateString
      ? new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'N/A';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6 bg-red-50 border border-red-200 rounded-3xl shadow-sm text-red-700">
        <p className="text-lg font-semibold mb-2">Unable to load groomer appointments</p>
        <p>{error}</p>
      </div>
    );
  }

  const metrics = {
    total: appointments.length,
    scheduled: appointments.filter((a) => a.status === 'scheduled').length,
    approved: appointments.filter((a) => a.status === 'approved').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    rejected: appointments.filter((a) => a.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF6E8] via-[#FFFAF2] to-[#F7EEE5] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] border border-amber-100 bg-white/90 p-6 shadow-xl shadow-amber-200/40 backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-amber-600">Appointment Manager</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">Grooming Appointments</h1>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                Review all grooming appointments and manage bookings with a modern dashboard view.
              </p>
            </div>
            <button
              onClick={fetchGroomerAppointments}
              className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-amber-200 transition hover:bg-amber-700"
            >
              <BellRing size={18} /> Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: 'Total', value: metrics.total, bg: 'bg-slate-950 text-white' },
              { label: 'Scheduled', value: metrics.scheduled, bg: 'bg-emerald-600 text-white' },
              { label: 'Approved', value: metrics.approved, bg: 'bg-cyan-600 text-white' },
              { label: 'Completed', value: metrics.completed, bg: 'bg-violet-600 text-white' },
              { label: 'Rejected', value: metrics.rejected, bg: 'bg-red-600 text-white' },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} rounded-3xl p-5 shadow-lg shadow-slate-200/30`}>
                <p className="text-xs uppercase tracking-[0.2em] opacity-80">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by name, email, phone, or groomer ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-3xl border border-amber-200 bg-white/90 px-12 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              />
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-500" />
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="rounded-full border border-amber-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-amber-300 hover:bg-amber-50"
            >
              Clear search
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-amber-100 bg-white shadow-xl shadow-amber-100/40">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left">
              <thead className="bg-slate-950 text-white">
                <tr>
                  {["User", "Date", "Time", "Groomer", "Fee", "Phone", "Email", "Status", "Actions"].map((label) => (
                    <th
                      key={label}
                      className="whitespace-nowrap px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-amber-100 bg-white text-slate-900">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-5 py-16 text-center text-slate-500">
                      No appointments match your search.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appointment, index) => (
                    <tr key={appointment._id || index} className="transition hover:bg-amber-50">
                      <td className="px-5 py-4 text-sm font-medium">{appointment.userName || 'Unknown'}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{formatDate(appointment.appointmentDate)}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{appointment.appointmentTime || 'N/A'}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{appointment.groomerId || 'N/A'}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">${appointment.appointmentFee?.toFixed(2) || '0.00'}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{appointment.phoneNo || 'N/A'}</td>
                      <td className="px-5 py-4 text-sm text-slate-600 truncate max-w-[220px]">{appointment.email || 'N/A'}</td>
                      <td className="px-5 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                            appointment.status === 'scheduled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : appointment.status === 'approved'
                              ? 'bg-cyan-100 text-cyan-800'
                              : appointment.status === 'completed'
                              ? 'bg-violet-100 text-violet-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {appointment.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleNotify(appointment)}
                            disabled={actionLoading === appointment._id}
                            className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:bg-amber-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                          >
                            <BellRing size={14} />
                            {actionLoading === appointment._id ? 'Processing' : 'Notify'}
                          </button>
                          <button
                            onClick={() => handleManage(appointment)}
                            disabled={actionLoading === appointment._id}
                            className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cyan-700 disabled:bg-cyan-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                          >
                            <ArrowRight size={14} /> Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentGroomerTable;
