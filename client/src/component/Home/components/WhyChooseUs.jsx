import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";

gsap.registerPlugin(ScrollTrigger);

const WhyChooseUs = () => {
  const sectionRef = useRef(null);
  const itemRefs = useRef([]);
  const imageRef = useRef(null);
  const headingRef = useRef(null);
  const containerRef = useRef(null);
  const badgeRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2
    });

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    const ctx = gsap.context(() => {
      // Animation for badge
      gsap.from(badgeRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: badgeRef.current,
          start: "top 80%",
          toggleActions: "play none none none"
        }
      });

      // Animation for heading with underline
      gsap.from(headingRef.current, {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 75%",
          toggleActions: "play none none none"
        }
      });

      gsap.from(headingRef.current.querySelector("span span"), {
        scaleX: 0,
        duration: 1.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 75%",
          toggleActions: "play none none none"
        }
      });

      // Animation for image
      gsap.from(imageRef.current, {
        x: -80,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: imageRef.current,
          start: "top 70%",
          toggleActions: "play none none none"
        }
      });

      // Animations for list items with staggered delay
      itemRefs.current.forEach((item, index) => {
        gsap.from(item, {
          x: -40,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: item,
            start: "top 80%",
            toggleActions: "play none none none"
          },
          delay: index * 0.1
        });
      });

      // Create a master trigger for the section
      const sectionTrigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top center",
        end: "bottom center",
        onEnter: () => {
          gsap.to([headingRef.current, imageRef.current, ...itemRefs.current], {
            opacity: 1,
            y: 0,
            x: 0,
            duration: 0.6,
            stagger: 0.05,
            ease: "power1.out"
          });
        },
        onLeaveBack: () => {
          gsap.to([headingRef.current, imageRef.current, ...itemRefs.current], {
            opacity: 0,
            y: 20,
            x: -20,
            duration: 0.6,
            stagger: 0.02,
            ease: "power1.in"
          });
        }
      });

      // Update ScrollTrigger on Lenis scroll
      lenis.on("scroll", () => {
        ScrollTrigger.update();
      });

      return () => {
        lenis.destroy();
        sectionTrigger.kill();
      };
    }, sectionRef);

    return () => {
      lenis.destroy();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-25 overflow-hidden bg-transparent"
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <div
          className="flex flex-col items-center text-center"
          ref={containerRef}
        >
          {/* Premium Badge */}
          <div
            ref={badgeRef}
            className="mb-8 px-3 py-1.5 bg-[#004080] text-white font-semibold rounded-full shadow-lg inline-flex items-center justify-center transform hover:scale-105 transition-transform duration-300 group"
          >
            <svg
              className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm tracking-wider">TRUSTED WORLDWIDE</span>
          </div>

          {/* Premium Heading */}
          <h2
            ref={headingRef}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-12 relative inline-block mt-2"
          >
            Why{" "}
            <span className="text-[#004080] relative">
              Choose Us
              <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-[#004080] to-[#004080]/0 rounded-full transition-all duration-500 transform origin-left"></span>
            </span>
          </h2>

          {/* Premium Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-7xl w-full">
            <div
              ref={imageRef}
              className="cursor-pointer relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white transform hover:shadow-3xl transition-all duration-500 group"
            >
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                alt="Happy students"
                className="w-full h-auto md:h-[600px] object-cover group-hover:scale-105 transition-transform duration-700 will-change-transform"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#004080]/80 via-[#004080]/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 text-white text-left">
                <h3 className="text-2xl md:text-3xl font-bold mb-3 !text-white">
                  Our Global Success
                </h3>
                <p className="text-lg opacity-90">
                  Join 10,000+ students across 50 countries
                </p>
              </div>
            </div>

            {/* Premium Content */}
            <div className="text-left">
              <ul className="space-y-6">
                {[
                  {
                    text: "95% Visa Approval Rate",
                    icon: (
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ),
                    description:
                      "Industry-leading success rate with documented results"
                  },
                  {
                    text: "Free IELTS/SAT Courses",
                    icon: (
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    ),
                    description:
                      "Premium test prep materials worth $500+ included free"
                  },
                  {
                    text: "Certified Counselors",
                    icon: (
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    ),
                    description:
                      "AACI-certified advisors with 10+ years experience"
                  },
                  {
                    text: "Zero File-Opening Fees",
                    icon: (
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ),
                    description:
                      "No hidden costs - we only get paid when you succeed"
                  }
                ].map((item, index) => (
                  <li
                    key={index}
                    ref={headingRef}
                    className="flex items-start bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-[6px] border-[#004080] group hover:bg-gray-50 will-change-transform"
                  >
                    <span className="text-[#004080] mr-5 mt-1 group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </span>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                        {item.text}
                      </h3>
                      <p className="text-gray-600 text-base md:text-lg">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
