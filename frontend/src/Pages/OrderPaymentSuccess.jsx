import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';

const OrderPaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoiceData, setInvoiceData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    toast.success("Payment completed successfully!");

    // Get order ID from URL parameters
    const orderId = searchParams.get('orderId');

    if (orderId) {
      // Fetch invoice data from backend
      fetchInvoiceData(orderId);
    }
  }, [searchParams]);

  const fetchInvoiceData = async (orderId) => {
    try {
      console.log('Fetching invoice data for order:', orderId);
      const response = await axios.get(`https://pet-care-backend-422z.onrender.com/api/order/invoice/${orderId}`);
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
    }
  };

  const generateInvoicePDF = async () => {
  if (!invoiceData) {
    toast.error("Invoice data not available");
    return;
  }

  setIsGenerating(true);

try {
  const doc = new jsPDF();
  doc.setFont("helvetica");

  // ----------------------------
  // Header
  // ----------------------------
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("FurEver CARE MANAGEMENT SYSTEM", 105, 20, { align: "center" });

  doc.setFontSize(16);
  doc.text("ORDER INVOICE", 105, 30, { align: "center" });

  // ----------------------------
  // Invoice & Transaction Details
  // ----------------------------
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 20, 50);
  doc.text(`Date: ${invoiceData.date}`, 20, 58);
  doc.text(`Time: ${invoiceData.time}`, 20, 66);
  doc.text(`Transaction ID: ${invoiceData.transactionId}`, 20, 74);

  // ----------------------------
  // Company Info
  // ----------------------------
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("From:", 20, 90);
  doc.text(invoiceData.company.name, 20, 98);
  doc.text(invoiceData.company.address, 20, 106);
  doc.text(`Phone: ${invoiceData.company.phone}`, 20, 114);
  doc.text(`Email: ${invoiceData.company.email}`, 20, 122);

  // ----------------------------
  // Customer Info
  // ----------------------------
  const custX = 120;
  doc.text("Bill To:", custX, 90);
  doc.text(invoiceData.customer.name, custX, 98);
  doc.text(invoiceData.customer.email, custX, 106);
  doc.text(invoiceData.customer.phone, custX, 114);
  doc.text(invoiceData.customer.address, custX, 122, { maxWidth: 80 });

  // ----------------------------
  // Order Details
  // ----------------------------
  doc.text("Order Details:", 20, 140);
  doc.text(`Status: ${invoiceData.order.status}`, 20, 148);
  doc.text(`Payment Method: ${invoiceData.order.paymentMethod}`, 20, 156);
  doc.text(`Order Date: ${invoiceData.order.date}`, 20, 164);

  // ----------------------------
  // Products Table (modern styling)
  // ----------------------------
  const tableHead = ["Product", "Qty", "Size", "Price", "Total"];
  const tableBody = invoiceData.products.map(p => ([
    p.name,
    String(p.quantity || 0),
    p.size || '-',
    `BDT ${Number(p.price || 0).toFixed(2)}`,
    `BDT ${Number(p.total || (p.price * p.quantity) || 0).toFixed(2)}`
  ]));

  if (typeof doc.autoTable === "function") {
    doc.autoTable({
      startY: 170,
      head: [tableHead],
      body: tableBody,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 252, 240] },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 24, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      didDrawPage: (data) => {
        // subtle divider above totals area
        const y = data.cursor.y + 6;
        doc.setDrawColor(220);
        doc.setLineWidth(0.5);
        doc.line(20, y, 190, y);
      }
    });
  }

  // ----------------------------
  // Payment Summary
  // ----------------------------
  // ----------------------------
  // Payment Summary (compute locally to ensure correctness)
  // ----------------------------
  const finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 18 : 260;
  const subtotalLocal = invoiceData.products.reduce((s, p) => s + Number(p.total || (p.price * p.quantity) || 0), 0);
  const deliveryChargeLocal = Number(invoiceData.payment?.deliveryCharge || 0);
  const totalLocal = Number((subtotalLocal + deliveryChargeLocal).toFixed(2));

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal', 130, finalY, { align: 'right' });
  doc.text(`BDT ${subtotalLocal.toFixed(2)}`, 190, finalY, { align: 'right' });

  doc.text('Delivery Charge', 130, finalY + 8, { align: 'right' });
  doc.text(`BDT ${deliveryChargeLocal.toFixed(2)}`, 190, finalY + 8, { align: 'right' });

  // Highlight total
  doc.setFillColor(34, 197, 94);
  doc.setTextColor(255, 255, 255);
  doc.rect(125, finalY + 14, 70, 12, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total', 130, finalY + 23, { align: 'left' });
  doc.text(`BDT ${totalLocal.toFixed(2)}`, 190, finalY + 23, { align: 'right' });
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');

  // ----------------------------
  // Payment Info
  // ----------------------------
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Payment Status: ${invoiceData.payment.status}`, 20, finalY + 18);
  doc.text(`Payment Method: ${invoiceData.payment.method}`, 20, finalY + 26);

  // ----------------------------
  // Footer
  // ----------------------------
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("Thank you for your order! You chose FurEver Care Management System.", 105, finalY + 45, { align: "center" });
  doc.text("For queries, contact our support team.", 105, finalY + 52, { align: "center" });

  // ----------------------------
  // Save PDF
  // ----------------------------
  doc.save(`Order-Invoice-${invoiceData.invoiceNumber}.pdf`);
  toast.success("Invoice downloaded successfully!");
 } catch (error) {
    console.error("Error generating invoice:", error);
    toast.error("Failed to generate invoice");
  } finally {
    setIsGenerating(false);
  }
};

  const handleContinue = () => {
    navigate('/orders');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-24 h-24 text-green-500 animate-pulse" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-green-600 mb-2">
          Order Confirmed! 🎉
        </h1>

        {/* Subheading */}
        <p className="text-gray-600 text-lg mb-6">
          Your payment has been processed successfully.
        </p>

        {/* Message */}
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
          <p className="text-green-700 text-sm mb-2">
            Thank you for your order! Your payment has been confirmed.
          </p>
          {invoiceData && (
            <div className="mt-3 p-3 bg-white rounded border">
              <p className="text-green-800 text-sm font-medium">Invoice #{invoiceData.invoiceNumber}</p>
              <p className="text-green-700 text-xs">Total: BDT {invoiceData.payment.total}</p>
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

        {/* Order Details Info */}
        <div className="text-left bg-gray-50 p-4 rounded mb-6">
          <p className="font-semibold text-gray-800 mb-2">What happens next?</p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>✓ Your order has been confirmed</li>
            <li>✓ Items will be prepared for shipping</li>
            <li>✓ You'll receive tracking information via email</li>
            <li>✓ Estimated delivery: 5-7 business days</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleContinue}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105"
          >
            View My Orders
          </button>
          <button
            onClick={() => navigate('/collection')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-300"
          >
            Return Home
          </button>
        </div>

        {/* Support Info */}
        <p className="text-gray-500 text-xs mt-8">
          Order confirmation will be sent to your registered email
        </p>
      </div>
    </div>
  );
};

export default OrderPaymentSuccess;
