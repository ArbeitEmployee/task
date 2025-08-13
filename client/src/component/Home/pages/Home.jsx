import React from "react";
import Hero from "../components/Hero";
import Services from "../components/Services";
import WhyChooseUs from "../components/WhyChooseUs";
import CTA from "../components/CTA";

const Home = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Global Background Elements */}
      {/* <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-[#004080] rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-blob"></div>
        <div className="absolute top-0 right-0 w-[70vw] h-[70vw] max-w-[700px] max-h-[700px] bg-[#ffd700] rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-[#a0cbe8] rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-blob animation-delay-4000"></div>

        <div className="absolute top-30 left-1/6 w-30 h-30 rounded-full border-4 border-[#004080]/20 animate-float !opacity-27"></div>
        <div className="absolute bottom-1/3 right-1/3 w-32 h-32 rounded-full border-4 border-[#ffd700]/20 animate-float animation-delay-3000"></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full border-4 border-[#a0cbe8]/20 animate-float animation-delay-6000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 rounded-full border-4 border-[#004080]/20 animate-float animation-delay-9000 !opacity-25"></div>
      </div> */}

      {/* Page Content */}
      <Hero />
      <div className="relative z-10">
        <WhyChooseUs />
        <Services />
        <CTA />
      </div>

      {/* Scroll Buttons Component */}
    </div>
  );
};

export default Home;
