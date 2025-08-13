/* eslint-disable no-unused-vars */
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const Events = () => {
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [sectionRef, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const upcomingEvents = [
    {
      id: 1,
      title: "Study in UK - Virtual Fair",
      date: "July 15, 2025",
      time: "3:00 PM - 6:00 PM",
      location: "Online (Zoom)",
      description:
        "Meet university representatives and learn about admission requirements for UK universities.",
      image:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
      id: 2,
      title: "GRE Preparation Workshop",
      date: "August 2, 2025",
      time: "10:00 AM - 4:00 PM",
      location: "Northern Lights Office, Dhaka",
      description:
        "Intensive workshop covering quantitative and verbal reasoning sections of the GRE exam.",
      image:
        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
      id: 3,
      title: "Canada Visa Policy Updates Seminar",
      date: "July 28, 2025",
      time: "4:00 PM - 6:00 PM",
      location: "Online (Webinar)",
      description:
        "Learn about the latest changes in Canadian student visa policies and how they affect applicants.",
      image:
        "https://images.unsplash.com/photo-1517935706615-2717063c2225?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
      id: 4,
      title: "IELTS Speaking Masterclass",
      date: "August 10, 2025",
      time: "2:00 PM - 5:00 PM",
      location: "Online (Zoom)",
      description:
        "Improve your speaking skills with our expert trainers and mock test sessions.",
      image:
        "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
      id: 5,
      title: "US University Application Workshop",
      date: "August 18, 2025",
      time: "11:00 AM - 2:00 PM",
      location: "Northern Lights Office, Dhaka",
      description:
        "Step-by-step guidance on completing successful applications to US universities.",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
      id: 6,
      title: "Scholarship Application Strategies",
      date: "September 5, 2025",
      time: "3:30 PM - 6:30 PM",
      location: "Online (Webinar)",
      description:
        "Learn how to find and apply for scholarships to fund your international education.",
      image:
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
      id: 7,
      title: "Study in Germany Information Session",
      date: "September 12, 2025",
      time: "4:00 PM - 7:00 PM",
      location: "Northern Lights Office, Dhaka",
      description:
        "Everything you need to know about studying in Germany - from applications to student life.",
      image:
        "https://images.unsplash.com/photo-1543157145-f78c636d023d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
      id: 8,
      title: "Statement of Purpose Writing Workshop",
      date: "September 20, 2025",
      time: "10:00 AM - 1:00 PM",
      location: "Online (Zoom)",
      description:
        "Craft a compelling SOP that stands out to admission committees.",
      image:
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    }
  ];

  const displayedEvents = showAllEvents
    ? upcomingEvents
    : upcomingEvents.slice(0, 3);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const headerVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        delay: 0.2
      }
    }
  };

  return (
    <section ref={sectionRef} className="py-36">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
          className="text-center mb-16"
        >
          <motion.span
            variants={itemVariants}
            className="cursor-pointer mb-8 px-3 py-1.5 bg-[#004080] text-white font-semibold rounded-full shadow-lg inline-flex items-center justify-center transform hover:scale-105 transition-transform duration-300 group"
          >
            Events
          </motion.span>
          <motion.h2
            variants={headerVariants}
            className="text-4xl md:text-5xl font-bold mb-4 !text-gray-900"
          >
            Upcoming <span className="text-[#004080]">Events</span>
          </motion.h2>
          <motion.p
            variants={headerVariants}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Join our exclusive events designed to help you achieve your academic
            dreams abroad.
          </motion.p>
        </motion.div>

        {/* Events Grid */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {displayedEvents.map((event) => (
            <motion.div
              key={event.id}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
            >
              {/* Event Image */}
              <div className="relative h-48">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-[#004080] text-white text-sm font-semibold px-3 py-1 rounded-full">
                  New
                </div>
              </div>

              {/* Event Content */}
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {event.title}
                  </h3>
                  <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {event.date}
                  </span>
                </div>

                <div className="flex items-center mb-3 text-gray-600">
                  <svg
                    className="w-5 h-5 text-[#004080] mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{event.time}</span>
                </div>

                <div className="flex items-center mb-4 text-gray-600">
                  <svg
                    className="w-5 h-5 text-[#004080] mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{event.location}</span>
                </div>

                <p className="mb-6 text-gray-700 flex-grow">
                  {event.description}
                </p>

                <div className="mt-auto">
                  <button className="w-full bg-[#004080] hover:bg-[#003366] text-white font-medium py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-[1.02]">
                    Register Now
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Show More/Less Button */}
        {upcomingEvents.length > 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6 }}
            className="text-center mt-12"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="px-8 py-3 border-2 border-[#004080] text-[#004080] hover:bg-[#004080] hover:text-white font-medium rounded-full transition duration-300"
            >
              {showAllEvents ? "Show Less Events" : "Show More Events"}
            </motion.button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Events;
