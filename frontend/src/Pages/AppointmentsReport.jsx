import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../config';
import { useNavigate } from 'react-router-dom';

const AppointmentsReport = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/StaffLogin');
      return;
    }
    fetchData(period);
  }, [period, navigate]);

  const fetchData = async (p) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BACKEND_URL}/api/reports/appointments-report?period=${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch');
      setData(json.data || []);
      setAppointments(json.appointments || []);
    } catch (err) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };


  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };



  const exportAppointmentsPDF = () => {
    if (!appointments || appointments.length === 0) return;
    const svg = document.querySelector('svg')?.outerHTML || '';
    const rowsHtml = appointments.map((r, idx) => `
      <tr>
        <td style="padding:6px;border:1px solid #ddd">${idx + 1}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(r.appointmentId || r._id || '')}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(r.appointmentDate ? new Date(r.appointmentDate).toISOString().slice(0,10) : '')}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(r.appointmentTime || '')}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(r.professionalName || r.doctorId || '')}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(r.userName || '')}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(r.userEmail || r.email || '')}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(r.appointmentType || '')}</td>
        <td style="padding:6px;border:1px solid #ddd">${r.appointmentFee || 0}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(r.status || '')}</td>
      </tr>
    `).join('');

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Appointments List</title>
          <style>
            body{font-family:Arial,Helvetica,sans-serif;margin:20px}
            table{width:100%;border-collapse:collapse;margin-top:16px}
            th,td{border:1px solid #ddd;padding:8px;text-align:left}
            th{background:#f3f3f3}
            h1{font-size:18px}
          </style>
        </head>
        <body>
          <h1>Appointments List (${escapeHtml(period)})</h1>
          ${svg}
          <table>
            <thead>
              <tr>
                <th style="padding:8px">#</th>
                <th style="padding:8px">Appointment ID</th>
                <th style="padding:8px">Date</th>
                <th style="padding:8px">Time</th>
                <th style="padding:8px">Professional</th>
                <th style="padding:8px">User</th>
                <th style="padding:8px">User Email</th>
                <th style="padding:8px">Type</th>
                <th style="padding:8px">Fee</th>
                <th style="padding:8px">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>`;

    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to export PDF.');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch (e) {
        console.error('Print failed', e);
      }
    }, 500);
  };

const Chart = ({ rows }) => {
  if (!rows || rows.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No chart data available for selected period.
      </div>
    );
  }

  const max = Math.max(...rows.map((r) => r.totalAppointments || 0));
  const width = 900;
  const height = 300;
  const barWidth = Math.max(45, Math.floor(width / rows.length) - 18);

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="min-w-[900px]">
        {rows.map((r, i) => {
          const x = 30 + i * (barWidth + 18);
          const h = max === 0 ? 0 : Math.round((r.totalAppointments / max) * (height - 90));
          const y = height - h - 50;

          return (
            <g key={r.doctorId || i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={h}
                rx="8"
                fill="#D88C6D"
              />

              <text
                x={x + barWidth / 2}
                y={y - 10}
                fontSize={13}
                textAnchor="middle"
                fill="#4E2D21"
                fontWeight="600"
              >
                {r.totalAppointments}
              </text>

              <text
                x={x + barWidth / 2}
                y={height - 24}
                fontSize={11}
                textAnchor="middle"
                fill="#555"
              >
                {(r.professionalName || r.doctorId || '').length > 12
                  ? `${(r.professionalName || r.doctorId).slice(0, 12)}...`
                  : r.professionalName || r.doctorId}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

return (
  <div className="min-h-screen bg-gradient-to-br from-[#F4E4D8] to-[#E6D5C1] p-6">
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#4E2D21]">
              Appointment Reports
            </h2>
            <p className="text-gray-600 mt-1">
              View appointment performance by professional and detailed appointment records.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3">
              <label className="font-medium text-[#4E2D21]">Period:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D88C6D]"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <button
              onClick={exportAppointmentsPDF}
              className="bg-[#1a202c] text-white px-5 py-2 rounded-lg hover:bg-[#2d3748] transition-colors"
            >
              Export Appointments PDF
            </button>
          </div>
        </div>

        {loading && (
          <p className="mt-4 text-[#4E2D21] font-medium">Loading reports...</p>
        )}

        {error && (
          <p className="mt-4 text-red-500 font-medium">{error}</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 border border-[#F4E4D8]">
          <p className="text-sm text-gray-500">Total Appointments</p>
          <h3 className="text-3xl font-bold text-[#4E2D21] mt-2">
            {appointments.length}
          </h3>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 border border-[#F4E4D8]">
          <p className="text-sm text-gray-500">Total Professionals</p>
          <h3 className="text-3xl font-bold text-[#4E2D21] mt-2">
            {data.length}
          </h3>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 border border-[#F4E4D8]">
          <p className="text-sm text-gray-500">Selected Period</p>
          <h3 className="text-3xl font-bold text-[#4E2D21] mt-2 capitalize">
            {period}
          </h3>
        </div>
      </div>

      {/* Chart Card */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-[#4E2D21]">
            Professional Appointment Overview
          </h3>
          <p className="text-gray-600 text-sm">
            Top professionals based on total appointments.
          </p>
        </div>

        <Chart rows={data.slice(0, 10)} />
      </div>

      {/* Professional Summary Table */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-[#4E2D21]">
            Professional Summary
          </h3>
          <p className="text-gray-600 text-sm">
            Appointment count grouped by professional.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-[#F4E4D8] text-[#4E2D21]">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Professional</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Total Appointments</th>
              </tr>
            </thead>

            <tbody>
              {data.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-600">
                    No data for selected period.
                  </td>
                </tr>
              )}

              {data.map((row, idx) => (
                <tr
                  key={row.doctorId || idx}
                  className="border-t hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{idx + 1}</td>
                  <td className="px-4 py-3">{row.professionalName || row.doctorId}</td>
                  <td className="px-4 py-3">{row.professionalEmail || '-'}</td>
                  <td className="px-4 py-3 capitalize">{row.role || '-'}</td>
                  <td className="px-4 py-3 font-semibold text-[#4E2D21]">
                    {row.totalAppointments}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-[#4E2D21]">
            Appointments ({appointments.length})
          </h3>
          <p className="text-gray-600 text-sm">
            Detailed appointment list for the selected period.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-[1200px] table-auto">
            <thead>
              <tr className="bg-[#F4E4D8] text-[#4E2D21]">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Professional</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">User Email</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Fee</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {appointments.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-600">
                    No appointments for selected period.
                  </td>
                </tr>
              )}

              {appointments.map((a, i) => (
                <tr
                  key={a.appointmentId || a._id || i}
                  className="border-t hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{i + 1}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {a.appointmentId || a._id}
                  </td>
                  <td className="px-4 py-3">
                    {a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : ''}
                  </td>
                  <td className="px-4 py-3">{a.appointmentTime || ''}</td>
                  <td className="px-4 py-3">{a.professionalName || a.doctorId}</td>
                  <td className="px-4 py-3">{a.userName || ''}</td>
                  <td className="px-4 py-3">{a.userEmail || a.email || ''}</td>
                  <td className="px-4 py-3 capitalize">{a.appointmentType || ''}</td>
                  <td className="px-4 py-3">{a.appointmentFee}</td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 capitalize">
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
);
};

export default AppointmentsReport;
