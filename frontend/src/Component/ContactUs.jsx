'use client';

import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { useState } from 'react';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We’ll respond soon, like a breeze all the way from Dhaka!');
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="bg-[#FFF5E7] min-h-screen font-sans">
      {/* Hero Section */}
      <div className="relative bg-[#F5EFEA] pt-32 pb-20 mt-28 px-6 sm:px-12 lg:pt-40 lg:pb-28 lg:px-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[#3A4F41] opacity-90"></div>
        </div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-lg">
            Reach Out to ChinuCare
          </h1>
          <p className="mt-6 text-xl text-[#F5EFEA] max-w-3xl mx-auto font-serif">
            Questions about adoption, pet care, or partnerships? We’re here from the heart of Dhaka.
          </p>
        </div>
      </div>

      {/* Contact Content */}
      <div className="py-24 px-6 sm:px-12 lg:px-24">
<div className="max-w-7xl mx-auto flex justify-center items-center min-h-[60vh]">          {/* Contact Information */}
          <div className="space-y-8 bg-white p-8 rounded-2xl shadow-xl border-t-4 border-[#D08860]">
            <h2 className="text-3xl font-extrabold text-[#3A4F41] font-serif">
              Get In Touch
            </h2>
            <p className="text-lg text-[#5A6F5C] italic">
              Our team is ready to help with pet adoption, care, or any inquiries.
            </p>

            <div className="space-y-6">
              <div className="flex items-start group hover:scale-105 transition-transform duration-300">
                <div className="flex-shrink-0 bg-[#FFF3E0] p-3 rounded-full shadow-md">
                  <MapPin className="h-6 w-6 text-[#D08860]" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-[#3A4F41]">Our Location</h3>
                  <p className="mt-1 text-[#5A6F5C]">
                    Mirpur 10<br />
                    Dhaka, Bangladesh 1216
                  </p>
                </div>
              </div>

              <div className="flex items-start group hover:scale-105 transition-transform duration-300">
                <a href="tel:+94771234567" className="flex-shrink-0 bg-[#E6F3E5] p-3 rounded-full shadow-md">
                  <Phone className="h-6 w-6 text-[#5A9367]" />
                </a>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-[#3A4F41]">Phone</h3>
                  <p className="mt-1 text-[#5A6F5C]">
                    Main: 01997237911<br />
                    Adoption: 01997237911
                  </p>
                </div>
              </div>

              <div className="flex items-start group hover:scale-105 transition-transform duration-300">
                <a href="mailto:info@Chinucare.lk" className="flex-shrink-0 bg-[#E6F1F9] p-3 rounded-full shadow-md">
                  <Mail className="h-6 w-6 text-[#6A8CAF]" />
                </a>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-[#3A4F41]">Email</h3>
                  <p className="mt-1 text-[#5A6F5C]">
                    info@Chinucare.lk<br />
                    adoptions@chinucare.lk
                  </p>
                </div>
              </div>

              <div className="flex items-start group hover:scale-105 transition-transform duration-300">
                <div className="flex-shrink-0 bg-[#F2EAF9] p-3 rounded-full shadow-md">
                  <Clock className="h-6 w-6 text-[#9C7BBC]" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-[#3A4F41]">Hours</h3>
                  <p className="mt-1 text-[#5A6F5C]">
                    Monday - Thursday: 8am - 5pm<br />
                    Saturday: 9am - 2pm<br />
                    Friday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>

    </div>
  );
}