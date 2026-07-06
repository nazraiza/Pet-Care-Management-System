import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

const PaymentCancel = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
        {/* Cancel Icon */}
        <div className="flex justify-center mb-6">
          <XCircle className="w-24 h-24 text-yellow-500" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-yellow-600 mb-2">
          Payment Cancelled ⏸️
        </h1>

        {/* Subheading */}
        <p className="text-gray-600 text-lg mb-6">
          Your payment has been cancelled.
        </p>

        {/* Message */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8 rounded">
          <p className="text-yellow-700 text-sm">
            No charges have been made to your account. Your appointment/order has not been confirmed. Please try again if you wish to proceed.
          </p>
        </div>

        {/* Information */}
        <div className="text-left bg-gray-50 p-4 rounded mb-8">
          <p className="font-semibold text-gray-800 mb-2">What happens next?</p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Your appointment/order is not confirmed</li>
            <li>• Your cart/details have been preserved</li>
            <li>• You can retry the payment anytime</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105"
          >
            Try Again
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
          Need help? Contact our support team
        </p>
      </div>
    </div>
  );
};

export default PaymentCancel;