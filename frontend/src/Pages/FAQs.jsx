import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How can I adopt a pet?",
      answer:
        "Go to the Adoption page, choose a pet, fill out the adoption form, and wait for the adoption coordinator to review your application.",
    },
    {
      question: "How do I book a pet care appointment?",
      answer:
        "Go to the Appointment page, select a professional, choose an available time slot, and submit your appointment request.",
    },
    {
      question: "Can I buy pet products from this platform?",
      answer:
        "Yes. You can visit the Marketplace page, browse products, add items to your cart, and place an order.",
    },
    {
      question: "Can I give my own pet for adoption?",
      answer:
        "Yes. You can use the adoption section to add your pet details and submit the information for adoption listing.",
    },
    {
      question: "How can I check my appointment or adoption status?",
      answer:
        "After logging in, go to your Profile or Dashboard section to view your appointment, adoption, and pet-related updates.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#F8E9D8] to-[#F5EFEA] px-6 py-20">
      <div className="max-w-4xl mx-auto text-center mb-14">
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-3xl bg-white/70 shadow-neumorphic flex items-center justify-center">
            <HelpCircle className="w-10 h-10 text-[#D08860]" />
          </div>
        </div>

        <h1 className="text-5xl font-extrabold text-[#3A4F41] mb-4">
          Frequently Asked <span className="text-[#D08860]">Questions</span>
        </h1>

        <p className="text-lg text-gray-600">
          Find answers to common questions about pet adoption, appointments,
          marketplace orders, and user services.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-5">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white/70 backdrop-blur-md rounded-2xl shadow-neumorphic overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between text-left px-7 py-6"
            >
              <span className="text-xl font-bold text-[#3A4F41]">
                {faq.question}
              </span>

              <ChevronDown
                className={`w-6 h-6 text-[#D08860] transition-transform duration-300 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>

            {openIndex === index && (
              <div className="px-7 pb-6 text-gray-600 leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .shadow-neumorphic {
          box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </div>
  );
};

export default FAQs;