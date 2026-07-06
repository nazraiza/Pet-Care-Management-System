import React from "react";
import { CalendarDays, User, PawPrint, Heart, Stethoscope } from "lucide-react";

const Blog = () => {
  const blogs = [
    {
      id: 1,
      title: "How to Prepare Your Home Before Adopting a Pet",
      category: "Adoption",
      date: "May 26, 2026",
      author: "PawPlatform Team",
      icon: <PawPrint className="w-8 h-8 text-[#D08860]" />,
      description:
        "Before bringing a pet home, make sure your living space is safe, comfortable, and ready for your new companion.",
    },
    {
      id: 2,
      title: "Why Regular Vet Checkups Are Important",
      category: "Pet Care",
      date: "May 24, 2026",
      author: "Pet Health Expert",
      icon: <Stethoscope className="w-8 h-8 text-[#5A9367]" />,
      description:
        "Routine veterinary visits help detect health issues early and keep your pet healthy, active, and happy.",
    },
    {
      id: 3,
      title: "Best Ways to Build Trust With Your New Pet",
      category: "Pet Tips",
      date: "May 22, 2026",
      author: "PawPlatform Team",
      icon: <Heart className="w-8 h-8 text-[#B3704D]" />,
      description:
        "Building trust takes patience, consistency, and love. Learn simple ways to create a strong bond with your pet.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#F8E9D8] to-[#F5EFEA] px-6 py-20">
      {/* Page Header */}
      <div className="max-w-5xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-extrabold text-[#3A4F41] mb-4">
          Pet Care <span className="text-[#D08860]">Blog</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Read helpful articles about pet adoption, health, care, and everyday pet parenting.
        </p>
      </div>

      {/* Blog Cards */}
      <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-3">
        {blogs.map((blog) => (
          <div
            key={blog.id}
            className="bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-neumorphic hover:shadow-neumorphic-hover transition-all duration-300 hover:scale-105"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#FFF3E0] flex items-center justify-center mb-6">
              {blog.icon}
            </div>

            <span className="inline-block bg-[#D08860]/10 text-[#B3704D] px-4 py-1 rounded-full text-sm font-semibold mb-4">
              {blog.category}
            </span>

            <h2 className="text-2xl font-bold text-[#3A4F41] mb-4 leading-snug">
              {blog.title}
            </h2>

            <p className="text-gray-600 mb-6 leading-relaxed">
              {blog.description}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{blog.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                <span>{blog.date}</span>
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-[#D08860] via-[#E6A77C] to-[#B3704D] text-white py-3 rounded-2xl font-semibold hover:scale-105 transition-all duration-300">
              Read More
            </button>
          </div>
        ))}
      </div>

      {/* Extra Section */}
      <div className="max-w-4xl mx-auto mt-20 bg-white/60 backdrop-blur-md rounded-3xl p-10 text-center shadow-neumorphic">
        <h2 className="text-3xl font-bold text-[#3A4F41] mb-4">
          Want to Learn More About Pet Care?
        </h2>
        <p className="text-gray-600 mb-6">
          Explore useful tips, health advice, adoption guidance, and product suggestions for your furry friends.
        </p>
        <button className="bg-[#D08860] text-white px-8 py-3 rounded-2xl hover:bg-[#B3704D] transition-all duration-300">
          Explore Articles
        </button>
      </div>

      <style>{`
        .shadow-neumorphic {
          box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.7);
        }
        .shadow-neumorphic-hover {
          box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.15), -4px -4px 8px rgba(255, 255, 255, 0.9);
        }
      `}</style>
    </div>
  );
};

export default Blog;