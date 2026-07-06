'use client';

import { useState, useEffect, useMemo } from "react";
import { Search, CalendarCheck, BellRing, CheckCircle2, XCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5003";

export default function VetAvailability() {
  const [availabilities, setAvailabilities] = useState([]);
  const [filteredAvailabilities, setFilteredAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [modalActionId, setModalActionId] = useState(null);

  const stats = useMemo(() => {
    const total = availabilities.length;
    const uniqueProfessionals = new Set(
      availabilities.map((availability) => availability.professionalName?.trim()).filter(Boolean)
    ).size;
    const totalFee = availabilities.reduce(
      (sum, availability) => sum + (Number(availability.chargePerAppointment) || 0),
      0
    );
    const upcoming = availabilities.filter((availability) => {
      const date = availability.appointmentDate ? new Date(availability.appointmentDate) : null;
      return date && date >= new Date();
    }).length;

    return {
      total,
      uniqueProfessionals,
      totalFee,
      averageFee: total ? totalFee / total : 0,
      upcoming,
    };
  }, [availabilities]);

  useEffect(() => {
    const fetchAvailabilities = async () => {
      try {
        const response = await fetch(`${API_URL}/api/appointments/veterinarian-Reqappointments`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || "Unable to load availability requests");
        }

        const result = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setAvailabilities(result);
        setFilteredAvailabilities(result);
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Unable to load availability requests");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilities();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAvailabilities(availabilities);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = availabilities.filter((availability) =>
      [availability.professionalName, availability.specialization, availability.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );

    setFilteredAvailabilities(filtered);
  }, [searchQuery, availabilities]);

  const showNotification = (message, type = "success") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }, 3000);
  };

  const openModal = (type, id) => {
    setModalType(type);
    setModalActionId(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType("");
    setModalActionId(null);
  };

  const handleModalConfirm = async () => {
    if (!modalActionId) return;

    const action = modalType === "accept" ? "accept" : "deny";
    setActionLoading(modalActionId);

    try {
      const response = await fetch(`${API_URL}/api/appointments/${modalActionId}/${action}`, {
        method: "PATCH",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `Unable to ${action} request`);
      }

      setAvailabilities((prev) => prev.filter((item) => item._id !== modalActionId));
      setFilteredAvailabilities((prev) => prev.filter((item) => item._id !== modalActionId));

      showNotification(
        action === "accept"
          ? "Vet availability request accepted."
          : "Vet availability request denied.",
        "success"
      );
    } catch (err) {
      console.error("Action error:", err);
      showNotification(err.message || `Unable to ${action} request`, "error");
    } finally {
      setActionLoading(null);
      closeModal();
    }
  };

  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A";

  if (loading) {
    return (
      <div className="flex min-h-[18rem] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        <h2 className="text-xl font-semibold">Unable to load veterinarian availability requests</h2>
        <p className="mt-3">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF6E8] via-[#FFFAF2] to-[#F7EEE5] px-4 py-8 sm:px-6 lg:px-8">
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`rounded-2xl border px-4 py-3 text-sm shadow-lg transition ${
              notification.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] border border-amber-100 bg-white/90 p-6 shadow-xl shadow-amber-200/40 backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <CalendarCheck className="text-amber-600" size={28} />
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-amber-600">Availability Manager</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-950">Vet Availability Requests</h1>
                <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                  Review incoming veterinarian availability requests, approve valid slots, and deny entries that do not meet the criteria.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-amber-200 transition hover:bg-amber-700"
            >
              <BellRing size={18} /> Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total Requests",
                value: stats.total,
                bg: "bg-slate-950 text-white",
              },
              {
                label: "Unique Professionals",
                value: stats.uniqueProfessionals,
                bg: "bg-emerald-600 text-white",
              },
              {
                label: "Upcoming",
                value: stats.upcoming,
                bg: "bg-cyan-600 text-white",
              },
              {
                label: "Avg Fee",
                value: `৳${stats.averageFee.toFixed(2)}`,
                bg: "bg-violet-600 text-white",
              },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} rounded-3xl p-5 shadow-lg shadow-slate-200/20`}>
                <p className="text-xs uppercase tracking-[0.2em] opacity-80">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by name, qualification, or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-3xl border border-amber-200 bg-white/90 px-12 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              />
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-500" />
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
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
                  {[
                    "Professional",
                    "Qualification",
                    "Email",
                    "Date",
                    "Time Slot",
                    "Fee",
                    "Notes",
                    "Actions",
                  ].map((label) => (
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
                {filteredAvailabilities.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-5 py-16 text-center text-slate-500">
                      No vet availability requests match your search.
                    </td>
                  </tr>
                ) : (
                  filteredAvailabilities.map((availability, index) => (
                    <tr key={availability._id || index} className="transition hover:bg-amber-50">
                      <td className="px-5 py-4 text-sm font-medium">
                        {availability.professionalName || "Unknown"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {availability.specialization || "N/A"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 truncate max-w-[220px]">
                        {availability.email || "N/A"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(availability.appointmentDate)}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {availability.startTime || "N/A"} - {availability.endTime || "N/A"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        ৳{Number(availability.chargePerAppointment || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 truncate max-w-[220px]">
                        {availability.specialNotes || "N/A"}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openModal("accept", availability._id)}
                            disabled={actionLoading === availability._id}
                            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:bg-emerald-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                          >
                            <CheckCircle2 size={14} />
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => openModal("deny", availability._id)}
                            disabled={actionLoading === availability._id}
                            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:bg-red-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                          >
                            <XCircle size={14} />
                            Deny
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl shadow-slate-900/10">
            <h3 className="text-xl font-semibold text-slate-950 mb-4">
              {modalType === "accept" ? "Confirm acceptance" : "Confirm denial"}
            </h3>
            <p className="text-slate-600 mb-6">
              {modalType === "accept"
                ? "Accept this availability request and move it into confirmed bookings."
                : "Deny this availability request and remove it from the pending queue."}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleModalConfirm}
                disabled={actionLoading === modalActionId}
                className="rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
              >
                {actionLoading === modalActionId ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
