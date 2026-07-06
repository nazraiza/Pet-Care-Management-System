import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader } from "lucide-react";

const RefundConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const refundId = searchParams.get("refundId");
  const appointmentId = searchParams.get("appointmentId");
  const amount = searchParams.get("amount");
  const status = searchParams.get("status");

  useEffect(() => {
    // Simulate processing
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleBackToDashboard = () => {
    navigate("/admin/redirect/appointment_manager/appointments/vet");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 text-lg font-semibold">Processing refund...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we process your SSLCommerz refund</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">Refund Processed</h1>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-gray-700 font-semibold mb-2">SSLCommerz Refund Details</p>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Refund ID:</span>
                <span className="font-mono text-gray-900 font-semibold">{refundId}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Appointment ID:</span>
                <span className="font-mono text-gray-900">{appointmentId?.slice(-8)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Refund Amount:</span>
                <span className="text-green-700 font-semibold">{amount} BDT</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee:</span>
                <span className="text-gray-900 font-semibold">0 BDT</span>
              </div>

              <div className="border-t border-green-200 pt-3 flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  {status || "Submitted"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Refund Information</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Full refund has been processed through SSLCommerz</li>
                  <li>No processing fees have been deducted</li>
                  <li>The patient will receive a confirmation email</li>
                  <li>Refund will be credited within 3-5 business days</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleBackToDashboard}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
        >
          Back to Appointments
        </button>

        <p className="text-center text-gray-500 text-xs mt-4">
          Refund ID saved to system. Patient will receive confirmation within a few moments.
        </p>
      </div>
    </div>
  );
};

export default RefundConfirmation;
