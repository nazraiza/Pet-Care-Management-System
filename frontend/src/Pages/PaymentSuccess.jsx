import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoiceData, setInvoiceData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    toast.success("Payment completed successfully!");

    const appointmentId = searchParams.get('appointmentId');

    if (appointmentId) {
      fetchInvoiceData(appointmentId);
    }
  }, [searchParams]);

  const fetchInvoiceData = async (appointmentId) => {
    try {
      console.log('Fetching invoice data for appointment:', appointmentId);
      const response = await axios.get(`http://localhost:5003/api/payment/invoice/${appointmentId}`);
      console.log('Invoice response:', response.data);
      if (response.data.success) {
        setInvoiceData(response.data.invoice);
        console.log('Invoice data set:', response.data.invoice);
      } else {
        console.error('Invoice API returned success=false');
        toast.error('Failed to load invoice data');
      }
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      toast.error('Failed to load invoice data');
      setInvoiceData({
        invoiceNumber: `INV-${appointmentId.slice(-8).toUpperCase()}`,
        transactionId: `PETCARE_${Date.now()}`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        customer: { name: "Customer", email: "customer@example.com", phone: "01700000000" },
        pet: { name: "Pet", type: "N/A", breed: "N/A" },
        appointment: { type: "Appointment", date: new Date().toLocaleDateString(), time: "N/A", professional: "Veterinarian" },
        payment: { amount: 0, currency: "BDT", status: "Paid", method: "SSLCommerz" },
        company: { name: "FurEver Care Management System", address: "Dhaka, Bangladesh", phone: "+880 1700-000000", email: "fur@furevercare.com" }
      });
    }
  };

  const formatTimeWithAmPm = (timeString) => {
    if (!timeString) return 'N/A';
    const trimmed = String(timeString).trim();
    if (/\b(am|pm)\b/i.test(trimmed)) return trimmed;

    const [hourPart, minutePart] = trimmed.split(':');
    if (!hourPart || minutePart == null) return trimmed;

    const hours = parseInt(hourPart, 10);
    const minutes = parseInt(minutePart, 10);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return trimmed;

    const period = hours >= 12 ? 'PM' : 'AM';
    const normalizedHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${normalizedHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const generateInvoicePDF = async () => {
  if (!invoiceData) {
    toast.error("Invoice data not available");
    return;
  }

  setIsGenerating(true);

  try {
    const doc = new jsPDF();

    // Set font
    doc.setFont("helvetica");

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("FurEver Care", 105, 20, { align: "center" });

    doc.setFontSize(16);
    doc.text("INVOICE", 105, 35, { align: "center" });

    // Invoice details
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 20, 50);
    doc.text(`Date: ${invoiceData.date}`, 20, 60);
    doc.text(`Time: ${formatTimeWithAmPm(invoiceData.time)}`, 20, 70);
    doc.text(`Transaction ID: ${invoiceData.transactionId}`, 20, 80);

    // Company details
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("From:", 20, 100);
    doc.text(invoiceData.company.name, 20, 110);
    doc.text(invoiceData.company.address, 20, 120);
    doc.text(`Phone: ${invoiceData.company.phone}`, 20, 130);
    doc.text(`Email: ${invoiceData.company.email}`, 20, 140);

    // Customer details
    doc.text("Bill To:", 120, 100);
    doc.text(invoiceData.customer.name, 120, 110);
    doc.text(invoiceData.customer.email, 120, 120);
    doc.text(invoiceData.customer.phone, 120, 130);

    // Pet details
    doc.text("Pet Details:", 20, 160);
    doc.text(`Name: ${invoiceData.pet.name}`, 20, 170);
    doc.text(`Type: ${invoiceData.pet.type}`, 20, 180);
    doc.text(`Breed: ${invoiceData.pet.breed}`, 20, 190);

    // Appointment details
    doc.text("Appointment Details:", 20, 210);
    doc.text(`Type: ${invoiceData.appointment.type}`, 20, 220);
    doc.text(`Date: ${invoiceData.appointment.date}`, 20, 230);
    doc.text(`Time: ${formatTimeWithAmPm(invoiceData.appointment.time)}`, 20, 240);
    doc.text(`Professional: ${invoiceData.appointment.professional}`, 20, 250);

    // Payment table
    const tableData = [
      ["Description", "Amount", "Status"],
      [`${invoiceData.appointment.type} Appointment`, `BDT ${invoiceData.payment.amount}`, invoiceData.payment.status]
    ];

    // Safe autoTable call
    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: 270,
        head: [tableData[0]],
        body: [tableData[1]],
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 40, halign: 'right' }, 2: { cellWidth: 40, halign: 'center' } }
      });
    }

    const finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : 290;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Amount: BDT ${invoiceData.payment.amount}`, 150, finalY, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Payment Method: ${invoiceData.payment.method}`, 20, finalY + 15);
    doc.text(`Payment Status: ${invoiceData.payment.status}`, 20, finalY + 25);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for choosing FurEver Care!", 105, finalY + 45, { align: "center" });
    doc.text("For any queries, please contact our support team.", 105, finalY + 55, { align: "center" });

    // Save the PDF
    doc.save(`Invoice-${invoiceData.invoiceNumber}.pdf`);

    toast.success("Invoice downloaded successfully!");
  } catch (error) {
    console.error("Error generating invoice:", error);
    toast.error("Failed to generate invoice");
  } finally {
    setIsGenerating(false);
  }
};
  const handleContinue = () => {
    navigate('/appointment');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">

        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <CheckCircle 
            className="w-24 h-24 text-green-500 animate-pulse" 
            strokeWidth={1.5} 
          />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-green-600 mb-2">
          Payment Successful! 🎉
        </h1>

        {/* Subheading */}
        <p className="text-gray-600 text-lg mb-6">
          Your payment has been processed successfully.
        </p>

        {/* Message */}
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
          <p className="text-green-700 text-sm mb-2">
            Thank you for your purchase! Your appointment has been confirmed.
          </p>
          {invoiceData && (
            <div className="mt-3 p-3 bg-white rounded border">
              <p className="text-green-800 text-sm font-medium">Invoice #{invoiceData.invoiceNumber}</p>
              <p className="text-green-700 text-xs">Amount: BDT {invoiceData.payment.amount}</p>
              <p className="text-green-700 text-xs">Transaction ID: {invoiceData.transactionId}</p>
            </div>
          )}
        </div>

        {/* Invoice Download Button */}
        {invoiceData && (
          <div className="mb-6">
            <button
              onClick={generateInvoicePDF}
              disabled={isGenerating}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating Invoice...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download Invoice</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">

          <button
            onClick={handleContinue}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105"
          >
            Continue to Dashboard
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-300"
          >
            Return Home
          </button>

        </div>

        <p className="text-gray-500 text-xs mt-8">
          Reference ID will be sent to your registered email
        </p>

      </div>
    </div>
  );
};

export default PaymentSuccess;