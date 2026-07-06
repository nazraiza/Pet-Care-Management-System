import React from "react";
import { ShieldCheck } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#F8E9D8] to-[#F5EFEA] px-6 py-20">
      <div className="max-w-5xl mx-auto bg-white/70 backdrop-blur-md rounded-3xl shadow-neumorphic p-8 md:p-12">
        
        <div className="text-center mb-12">
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-3xl bg-[#FFF3E0] flex items-center justify-center shadow-neumorphic">
              <ShieldCheck className="w-10 h-10 text-[#D08860]" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-[#3A4F41] mb-4">
            Privacy <span className="text-[#D08860]">Policy</span>
          </h1>

          <p className="text-gray-600 text-lg">
            Learn how PawPlatform collects, uses, and protects your personal information.
          </p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-[#3A4F41] mb-3">
              1. Information We Collect
            </h2>
            <p>
              We may collect information such as your name, email address, phone number,
              pet details, appointment information, adoption application details, and order
              information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#3A4F41] mb-3">
              2. How We Use Your Information
            </h2>
            <p>
              Your information is used to manage pet adoption requests, appointment bookings,
              marketplace orders, user profiles, notifications, and platform communication.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#3A4F41] mb-3">
              3. Data Protection
            </h2>
            <p>
              We aim to protect your personal data using appropriate security measures.
              User data should only be accessed by authorized users or administrators for
              valid platform-related purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#3A4F41] mb-3">
              4. Pet and Adoption Information
            </h2>
            <p>
              Pet profiles, adoption applications, and home visit information are used only
              for adoption management and communication between users and adoption managers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#3A4F41] mb-3">
              5. Payments and Orders
            </h2>
            <p>
              Marketplace payment and order details are used to process purchases, refunds,
              delivery updates, and transaction records. Payment processing may be handled
              through third-party payment services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#3A4F41] mb-3">
              6. Contact
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please contact the
              platform administrator through the Contact Us page.
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

export default PrivacyPolicy;