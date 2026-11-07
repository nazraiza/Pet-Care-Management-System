'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { js2xml } from 'xml-js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ReportPageOne() {
  const [period, setPeriod] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reportRef = useRef(null);
  const [profDoctorId, setProfDoctorId] = useState('');
  const [profPeriod, setProfPeriod] = useState('weekly');
  const [profLoading, setProfLoading] = useState(false);
  const [profError, setProfError] = useState(null);
  const [profAppointments, setProfAppointments] = useState([]);
  const [profSearchPerformed, setProfSearchPerformed] = useState(false);

  const handleFetchAppointments = async () => {
    if (!profDoctorId) {
      setProfError('Please enter your Professional ID');
      setProfAppointments([]);
      setProfSearchPerformed(true);
      return [];
    }

    setProfLoading(true);
    setProfError(null);
    setProfSearchPerformed(true);

    try {
      const res = await axios.get('https://pet-care-backend-422z.onrender.com/api/appointments/professional/report', {
        params: { doctorId: profDoctorId, period: profPeriod },
      });

      const appointments = Array.isArray(res.data.appointments) ? res.data.appointments : [];
      setProfAppointments(appointments);

      if (appointments.length === 0) {
        setProfError('No appointments found for this vet and period.');
      }

      return appointments;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch appointments';
      setProfError(message);
      setProfAppointments([]);
      return [];
    } finally {
      setProfLoading(false);
    }
  };

  // Fetch default report (daily) on component mount
  useEffect(() => {
    const fetchDefaultReport = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('Fetching default daily report');
        const response = await axios.get('https://pet-care-backend-422z.onrender.com/api/appointments/reports/generate', {
          params: { period: 'daily' },
        });
        console.log('Default report response:', response.data);
        setReportData(response.data.data);
      } catch (err) {
        console.error('Error fetching default report:', err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDefaultReport();

    // Auto-detect professional user from localStorage and prefill pID
    try {
      const profRaw = localStorage.getItem('professionalUser');
      if (profRaw) {
        const prof = JSON.parse(profRaw);
        if (prof && (prof.pID || prof.pId || prof.pid)) {
          setProfDoctorId(prof.pID || prof.pId || prof.pid);
        }
      }
    } catch (e) {
      console.warn('Could not parse professionalUser from localStorage', e);
    }
  }, []);

  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault(); // Handle form submission if triggered manually
    setLoading(true);
    setError(null);

    try {
      console.log('Making API request to generate report with period:', period);
      const response = await axios.get('https://pet-care-backend-422z.onrender.com/api/appointments/reports/generate', {
        params: { period, startDate: period === 'custom' ? startDate : undefined, endDate: period === 'custom' ? endDate : undefined },
      });
      console.log('API response received:', response.data);
      setReportData(response.data.data);
    } catch (err) {
      console.error('Error making API request:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = reportRef.current;
    if (!element) {
      console.error('Report element not found for PDF generation');
      return;
    }
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('Appointment-Manager-Report.pdf');
  };

  const handleDownloadXML = () => {
    if (!reportData) {
      console.error('No report data available for XML download');
      return;
    }

    const xmlData = {
      declaration: { attributes: { version: '1.0', encoding: 'utf-8' } },
      elements: [
        {
          type: 'element',
          name: 'Report',
          elements: [
            {
              type: 'element',
              name: 'Period',
              elements: [{ type: 'text', text: period === 'daily' ? 'Daily' : period === 'monthly' ? 'Monthly' : `${startDate} to ${endDate}` }],
            },
            {
              type: 'element',
              name: 'RevenueByCategory',
              elements: reportData.revenueByCategory.map(item => ({
                type: 'element',
                name: 'Category',
                elements: [
                  { type: 'element', name: 'Name', elements: [{ type: 'text', text: item.category }] },
                  { type: 'element', name: 'Appointments', elements: [{ type: 'text', text: item.appointmentCount.toString() }] },
                  { type: 'element', name: 'Revenue', elements: [{ type: 'text', text: item.totalRevenue.toFixed(2) }] },
                ],
              })),
            },
            {
              type: 'element',
              name: 'ScheduledVsCancelled',
              elements: reportData.scheduledVsCancelled.map(item => ({
                type: 'element',
                name: 'AppointmentType',
                elements: [
                  { type: 'element', name: 'Type', elements: [{ type: 'text', text: item.appointmentType }] },
                  { type: 'element', name: 'ScheduledOrCompleted', elements: [{ type: 'text', text: item.scheduledOrCompleted.toString() }] },
                  { type: 'element', name: 'Cancelled', elements: [{ type: 'text', text: item.cancelled.toString() }] },
                ],
              })),
            },
            {
              type: 'element',
              name: 'CustomerFrequency',
              elements: reportData.customerFrequency.map(item => ({
                type: 'element',
                name: 'Frequency',
                elements: [
                  { type: 'element', name: 'AppointmentCount', elements: [{ type: 'text', text: item.appointmentCount.toString() }] },
                  { type: 'element', name: 'CustomerCount', elements: [{ type: 'text', text: item.customerCount.toString() }] },
                ],
              })),
            },
          ],
        },
      ],
    };

    const xmlString = js2xml(xmlData, { compact: false, spaces: 2 });
    const blob = new Blob([xmlString], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Appointment-Manager-Report.xml';
    link.click();
    URL.revokeObjectURL(url);
  };

  const escapeHtml = (str) => {
    if (!str && str !== 0) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const getReportSummaryText = (appointment) => {
    if (appointment.prescription) {
      const medicines = Array.isArray(appointment.prescription.medicines)
        ? appointment.prescription.medicines.map((m) => m.name || m).join(', ')
        : appointment.prescription.medicine || '';
      return `Prescription: ${medicines || 'Provided'}`;
    }

    if (appointment.reportType || appointment.type) {
      return `${appointment.reportType || appointment.type} report provided`;
    }

    if (appointment.notes || appointment.description) {
      return appointment.notes || appointment.description;
    }

    return 'No report details';
  };

  const handleProfessionalDownload = async () => {
    const appointments = await handleFetchAppointments();
    if (!appointments || appointments.length === 0) {
      return;
    }

    const rows = appointments.map((a, idx) => `
      <tr>
        <td style="padding:6px;border:1px solid #ddd">${idx + 1}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : '')}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(a.appointmentTime || '')}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(a.userName || '')}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(a.appointmentType || '')}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(a.appointmentFee || '')}</td>
        <td style="padding:6px;border:1px solid #ddd">${escapeHtml(a.status || '')}</td>
      </tr>
    `).join('');

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>My Appointments</title><style>body{font-family:Arial,Helvetica,sans-serif;margin:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f3f3}</style></head><body><h2>Appointments for ${escapeHtml(profDoctorId)}</h2><p>Period: ${escapeHtml(profPeriod)}</p><table><thead><tr><th>#</th><th>Date</th><th>Time</th><th>User</th><th>Type</th><th>Fee</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;

    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!printWindow) {
      setProfError('Pop-up blocked. Allow pop-ups to download PDF.');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  // Chart Data Preparation with Fallbacks
  const revenueByCategoryChartData = reportData?.revenueByCategory?.length
    ? {
        labels: reportData.revenueByCategory.map((item) => item.category),
        datasets: [
          {
            label: 'Revenue ($)',
            data: reportData.revenueByCategory.map((item) => item.totalRevenue),
            backgroundColor: '#FBBF24', // Amber-400
          },
          {
            label: 'Appointment Count',
            data: reportData.revenueByCategory.map((item) => item.appointmentCount),
            backgroundColor: '#D97706', // Amber-600
          },
        ],
      }
    : null;

  const scheduledVsCancelledChartData = reportData?.scheduledVsCancelled?.length
    ? {
        labels: reportData.scheduledVsCancelled.map((item) => item.appointmentType),
        datasets: [
          {
            label: 'Scheduled/Completed',
            data: reportData.scheduledVsCancelled.map((item) => item.scheduledOrCompleted),
            backgroundColor: '#FBBF24', // Amber-400
          },
          {
            label: 'Cancelled',
            data: reportData.scheduledVsCancelled.map((item) => item.cancelled),
            backgroundColor: '#D97706', // Amber-600
          },
        ],
      }
    : null;

  const customerFrequencyChartData = reportData?.customerFrequency?.length
    ? {
        labels: reportData.customerFrequency.map((item) => item.appointmentCount),
        datasets: [
          {
            label: 'Number of Customers',
            data: reportData.customerFrequency.map((item) => item.customerCount),
            backgroundColor: '#FBBF24', // Amber-400
            borderColor: '#D97706', // Amber-600
            borderWidth: 1,
          },
        ],
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] to-[#F5EFEA] px-6 py-12 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-3xl mt-20">
        <div className="bg-white shadow-lg rounded-xl p-6 border border-amber-200">
          <h4 className="text-lg font-semibold text-amber-800 mb-3">Professional - Download Your Appointments</h4>
          <p className="text-sm text-amber-600 mb-4">Enter your Professional ID (pID) and select a period to download your appointments as PDF.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <input
              type="text"
              placeholder="Professional ID (pID)"
              value={profDoctorId}
              onChange={(e) => setProfDoctorId(e.target.value)}
              className="col-span-2 px-3 py-2 border border-amber-200 rounded-lg"
            />
            <select value={profPeriod} onChange={(e) => setProfPeriod(e.target.value)} className="px-3 py-2 border border-amber-200 rounded-lg">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button onClick={handleFetchAppointments} className="bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 w-full sm:w-auto">View Appointments</button>
              <button onClick={handleProfessionalDownload} className="bg-[#D08860] text-white py-2 px-4 rounded-lg hover:bg-[#B3714E] w-full sm:w-auto">Download My Appointments PDF</button>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {profLoading && <span className="text-amber-600">Fetching appointments...</span>}
              {profError && <span className="text-red-500">{profError}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl mt-8">
        <div className="bg-white shadow-lg rounded-xl p-6 border border-amber-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <div>
              <h3 className="text-xl font-semibold text-amber-900">Appointment Reports</h3>
              <p className="text-sm text-amber-600">Showing appointments for vet ID {profDoctorId || '—'} during the selected period.</p>
            </div>
            {profAppointments.length > 0 && (
              <span className="text-sm text-amber-700 font-medium">{profAppointments.length} appointment{profAppointments.length === 1 ? '' : 's'} found</span>
            )}
          </div>

          {profAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-amber-200">
                <thead className="bg-amber-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-amber-700">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-amber-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-amber-700">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-amber-700">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-amber-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-amber-700">Fee</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-amber-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 bg-white">
                  {profAppointments.map((appointment, idx) => (
                    <tr key={`${appointment._id || idx}-${idx}`}>
                      <td className="px-4 py-3 text-sm text-amber-800">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm text-amber-800">{appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-sm text-amber-800">{appointment.appointmentTime || '—'}</td>
                      <td className="px-4 py-3 text-sm text-amber-800">{appointment.userName || appointment.userId || '—'}</td>
                      <td className="px-4 py-3 text-sm text-amber-800">{appointment.appointmentType || '—'}</td>
                      <td className="px-4 py-3 text-sm text-amber-800">{appointment.appointmentFee ? `৳${appointment.appointmentFee}` : '—'}</td>
                      <td className="px-4 py-3 text-sm text-amber-800">{appointment.status || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : profSearchPerformed ? (
            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-8 text-center text-amber-700">
              {profError ? profError : 'No appointment reports found for the selected professional and period.'}
            </div>
          ) : (
            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-8 text-center text-amber-700">
              Enter a professional ID and choose a period, then click View Appointments to see results.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
