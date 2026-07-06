import React from "react";
import { FileText } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#F8E9D8] to-[#F5EFEA] px-6 py-20">
      <div className="max-w-5xl mx-auto bg-white/70 backdrop-blur-md rounded-3xl shadow-neumorphic p-8 md:p-12">
        
        <div className="text-center mb-12">
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-3xl bg-[#FFF3E0] flex items-center justify-center shadow-neumorphic">
              <FileText className="w-10 h-10 text-[#D08860]" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-[#3A4F41] mb-4">
            Terms of <span className="text-[#D08860]">Service</span>
          </h1>

          <p className="text-gray-600 text-lg">
            Please read these terms carefully before using PawPlatform.
          </p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-[#3A4F41] mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By using PawPlatform, you agree to follow these terms and conditions.
              If you do not agree, you should not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#3A4F41] mb-3">
              2. User Responsibilities
            </h2>
            <p>
              Users must provide accurate information when creating accounts, booking
              appointments, submitting adoption forms, or placing marketplace orders.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#3A4F41] mb-3">
              3. Pet Adoption Services
            </h2>
            <p>
              Adoption applications are reviewed by the adoption management team.
              Submitting an application does not guarantee adoption approval.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#3A4F41] mb-3">
              4. Appointment Services
            </h2>
            <p>
              Users are responsible for booking appointments using correct information.
              Appointment approval, cancellation, and refund requests may depend on platform
              rules and manager approval.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#3A4F41] mb-3">
              5. Marketplace Orders
            </h2>
            <p>
              Product availability, prices, payments, delivery, and refund requests are
              managed through the marketplace system. Users should review order details
              before confirming payment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#3A4F41] mb-3">
              6. Account Safety
            </h2>
            <p>
              Users are responsible for keeping their login information secure. Any misuse
              of the platform may result in restricted access.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#3A4F41] mb-3">
              7. Changes to Terms
            </h2>
            <p>
              PawPlatform may update these terms when necessary. Continued use of the
              platform means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#3A4F41] mb-3">
              8. Contact
            </h2>
            <p>
              For questions about these Terms of Service, please contact the platform
              administrator through the Contact Us page.
            </p>
          </section>
        </div>
      </div>

      <style>{`
        .shadow-neumorphic {
          box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </div>
  );
};

export default TermsOfService;