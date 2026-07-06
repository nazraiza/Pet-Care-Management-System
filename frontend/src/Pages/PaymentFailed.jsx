import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const PaymentFailed = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <AlertCircle className="w-24 h-24 text-red-500" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-red-600 mb-2">
          Payment Failed ❌
        </h1>

        {/* Subheading */}
        <p className="text-gray-600 text-lg mb-6">
          We couldn't process your payment at this time.
        </p>

        {/* Message */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded">
          <p className="text-red-700 text-sm">
            Please check your payment details and try again. If you continue to experience issues, please contact our support team.
          </p>
        </div>

        {/* Possible Reasons */}
        <div className="text-left bg-gray-50 p-4 rounded mb-8">
          <p className="font-semibold text-gray-800 mb-3">Possible reasons:</p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Insufficient funds</li>
            <li>• Incorrect card details</li>
            <li>• Payment gateway timeout</li>
            <li>• Card declined by bank</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105"
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

export default PaymentFailed;