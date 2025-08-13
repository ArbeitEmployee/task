// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, textVariant } from "../utils/motion";
import React, { useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useEffect } from "react";
import "./Countries.css";
gsap.registerPlugin(ScrollTrigger);

const Countries = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [activeDetail, setActiveDetail] = useState(null);
  const heroRef = useRef(null);
  const scrollIndicatorRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(max-width: 767px)", () => {
        gsap.fromTo(
          heroRef.current,
          { minHeight: "100vh" },
          {
            minHeight: "70vh",
            ease: "none",
            scrollTrigger: {
              trigger: heroRef.current,
              start: "top top",
              end: "+=300",
              scrub: 0.6,
              invalidateOnRefresh: true
            }
          }
        );
      });

      mm.add("(min-width: 768px)", () => {
        gsap.fromTo(
          heroRef.current,
          { minHeight: "100vh" },
          {
            minHeight: "60vh",
            ease: "none",
            scrollTrigger: {
              trigger: heroRef.current,
              start: "top top",
              end: "+=400",
              scrub: 0.6,
              invalidateOnRefresh: true
            }
          }
        );
      });

      gsap.killTweensOf(contentRef.current);
      gsap.set(contentRef.current, { clearProps: "all" });

      gsap.fromTo(
        scrollIndicatorRef.current,
        { opacity: 1 },
        {
          opacity: 0,
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top+=40",
            end: "+=200",
            scrub: 0.6
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const topDestinations = [
    {
      id: "finland",
      name: "Finland",
      flag: "🇫🇮",
      highlights: [
        "Free education (EU students)",
        "Post-study work visa: 1 year",
        "High quality education system",
        "Safe and clean environment"
      ],
      details: {
        educationCosts: [
          "EU Students: Free",
          "Non-EU: €4,000-18,000/year",
          "Living Costs: €700-1,200/month"
        ],
        workOpportunities: [
          "25 hrs/week during studies",
          "Full-time during holidays",
          "1-year job seeker visa after graduation",
          "Strong tech sector"
        ],
        visaProcess: [
          "University admission",
          "Financial proof (€6,720/year)",
          "Health insurance",
          "Residence permit application",
          "Processing Time: 1-3 months"
        ],
        scholarships: [
          "Finnish Government Scholarships",
          "University-specific scholarships",
          "Erasmus+"
        ],
        accommodation: [
          "Student housing: €250-500/month",
          "Shared apartments: €400-700/month",
          "Private studios: €600-900/month"
        ],
        visaSuccessRate: "89% (2023 data)"
      }
    },
    {
      id: "denmark",
      name: "Denmark",
      flag: "🇩🇰",
      highlights: [
        "6-month job seeker visa",
        "English-taught programs",
        "Work up to 20 hrs/week",
        "High standard of living"
      ],
      details: {
        educationCosts: [
          "EU Students: Free",
          "Non-EU: €6,000-16,000/year",
          "Living Costs: €800-1,400/month"
        ],
        workOpportunities: [
          "20 hrs/week during term",
          "Full-time June-August",
          "6-month post-study residence permit",
          "Strong renewable energy sector"
        ],
        visaProcess: [
          "University admission",
          "Proof of funds (€1,000/month)",
          "Residence permit application",
          "Biometrics registration",
          "Processing Time: 2-3 months"
        ],
        scholarships: [
          "Danish Government Scholarships",
          "Erasmus Mundus",
          "University scholarships"
        ],
        accommodation: [
          "Student dorms: €400-600/month",
          "Shared apartments: €500-800/month",
          "Private studios: €700-1,200/month"
        ],
        visaSuccessRate: "87% (2023 data)"
      }
    },
    {
      id: "sweden",
      name: "Sweden",
      flag: "🇸🇪",
      highlights: [
        "6-month job seeker visa",
        "No tuition for EU students",
        "Innovative teaching methods",
        "Strong focus on sustainability"
      ],
      details: {
        educationCosts: [
          "EU Students: Free",
          "Non-EU: €8,000-15,000/year",
          "Living Costs: €700-1,200/month"
        ],
        workOpportunities: [
          "No hour limit during studies",
          "6-month residence permit extension after graduation",
          "Strong IT and engineering sectors"
        ],
        visaProcess: [
          "University admission",
          "Financial proof (€860/month)",
          "Residence permit application",
          "Processing Time: 1-3 months"
        ],
        scholarships: [
          "Swedish Institute Scholarships",
          "University scholarships",
          "Erasmus+"
        ],
        accommodation: [
          "Student housing: €300-600/month",
          "Shared apartments: €400-700/month",
          "Private studios: €600-1,000/month"
        ],
        visaSuccessRate: "85% (2023 data)"
      }
    },
    {
      id: "norway",
      name: "Norway",
      flag: "🇳🇴",
      highlights: [
        "Free tuition at public universities",
        "Work up to 20 hrs/week",
        "1-year job seeker visa",
        "Stunning natural environment"
      ],
      details: {
        educationCosts: [
          "Public Universities: Free",
          "Private: €7,000-15,000/year",
          "Living Costs: €900-1,400/month"
        ],
        workOpportunities: [
          "20 hrs/week during studies",
          "Full-time during holidays",
          "1-year residence permit after graduation",
          "Strong maritime/oil industries"
        ],
        visaProcess: [
          "University admission",
          "Financial proof (€12,350/year)",
          "Residence permit application",
          "Processing Time: 1-3 months"
        ],
        scholarships: [
          "Quota Scheme Scholarships",
          "Erasmus Mundus",
          "University scholarships"
        ],
        accommodation: [
          "Student housing: €400-700/month",
          "Shared apartments: €500-900/month",
          "Private studios: €700-1,300/month"
        ],
        visaSuccessRate: "83% (2023 data)"
      }
    },
    {
      id: "cyprus",
      name: "Cyprus",
      flag: "🇨🇾",
      highlights: [
        "Affordable tuition fees",
        "Warm Mediterranean climate",
        "EU degree recognition",
        "English widely spoken"
      ],
      details: {
        educationCosts: [
          "Undergraduate: €3,000-8,000/year",
          "Graduate: €5,000-12,000/year",
          "Living Costs: €600-1,000/month"
        ],
        workOpportunities: [
          "20 hrs/week during studies",
          "1-year residence permit after graduation",
          "Growing tourism and shipping industries"
        ],
        visaProcess: [
          "University admission",
          "Proof of funds (€7,000/year)",
          "Health insurance",
          "Student visa application",
          "Processing Time: 4-8 weeks"
        ],
        scholarships: [
          "Government scholarships",
          "University scholarships",
          "Erasmus+"
        ],
        accommodation: [
          "University housing: €200-400/month",
          "Shared apartments: €300-500/month",
          "Private studios: €400-700/month"
        ],
        visaSuccessRate: "91% (2023 data)"
      }
    },
    {
      id: "malta",
      name: "Malta",
      flag: "🇲🇹",
      highlights: [
        "English official language",
        "Sunny Mediterranean climate",
        "EU member benefits",
        "Growing education hub"
      ],
      details: {
        educationCosts: [
          "Undergraduate: €6,000-10,000/year",
          "Graduate: €8,000-15,000/year",
          "Living Costs: €700-1,200/month"
        ],
        workOpportunities: [
          "20 hrs/week during studies",
          "6-month residence permit after graduation",
          "Strong gaming and financial services sectors"
        ],
        visaProcess: [
          "University admission",
          "Proof of funds (€700/month)",
          "Health insurance",
          "Student visa application",
          "Processing Time: 4-6 weeks"
        ],
        scholarships: [
          "Malta Government Scholarships",
          "University scholarships",
          "Erasmus+"
        ],
        accommodation: [
          "Student residences: €400-600/month",
          "Shared apartments: €500-800/month",
          "Private studios: €700-1,100/month"
        ],
        visaSuccessRate: "93% (2023 data)"
      }
    },
    {
      id: "poland",
      name: "Poland",
      flag: "🇵🇱",
      highlights: [
        "Affordable living costs",
        "EU degree recognition",
        "Growing economy",
        "Rich cultural heritage"
      ],
      details: {
        educationCosts: [
          "EU Students: Free (Polish programs)",
          "Non-EU: €2,000-5,000/year",
          "Living Costs: €400-800/month"
        ],
        workOpportunities: [
          "20 hrs/week during studies",
          "Full-time during holidays",
          "3-month job seeker visa after graduation"
        ],
        visaProcess: [
          "University admission",
          "Proof of funds (€500/month)",
          "Health insurance",
          "Student visa application",
          "Processing Time: 3-6 weeks"
        ],
        scholarships: [
          "Polish Government Scholarships",
          "Erasmus+",
          "University scholarships"
        ],
        accommodation: [
          "Student dorms: €150-300/month",
          "Shared apartments: €250-500/month",
          "Private studios: €400-700/month"
        ],
        visaSuccessRate: "88% (2023 data)"
      }
    },
    {
      id: "italy",
      name: "Italy",
      flag: "🇮🇹",
      highlights: [
        "Affordable public universities",
        "Rich cultural experience",
        "EU access after studies",
        "World-class design programs"
      ],
      details: {
        educationCosts: [
          "Public Universities: €900-4,000/year",
          "Private: €6,000-20,000/year",
          "Living Costs: €700-1,200/month"
        ],
        workOpportunities: [
          "20 hrs/week during studies",
          "1-year residence permit after graduation",
          "Strong fashion and design industries"
        ],
        visaProcess: [
          "University pre-enrollment",
          "Proof of funds (€6,000/year)",
          "Health insurance",
          "Student visa application",
          "Processing Time: 1-3 months"
        ],
        scholarships: [
          "Italian Government Scholarships",
          "EDISU Piemonte",
          "University scholarships"
        ],
        accommodation: [
          "Student housing: €300-600/month",
          "Shared apartments: €400-800/month",
          "Private studios: €600-1,000/month"
        ],
        visaSuccessRate: "84% (2023 data)"
      }
    },
    {
      id: "spain",
      name: "Spain",
      flag: "🇪🇸",
      highlights: [
        "Affordable living costs",
        "Vibrant student life",
        "1-year job seeker visa",
        "EU access after studies"
      ],
      details: {
        educationCosts: [
          "Public Universities: €750-2,500/year",
          "Private: €5,000-18,000/year",
          "Living Costs: €600-1,100/month"
        ],
        workOpportunities: [
          "20 hrs/week during studies",
          "1-year residence permit after graduation",
          "Strong tourism and hospitality sectors"
        ],
        visaProcess: [
          "University admission",
          "Proof of funds (€600/month)",
          "Health insurance",
          "Student visa application",
          "Processing Time: 1-3 months"
        ],
        scholarships: [
          "Spanish Government Scholarships",
          "Erasmus+",
          "University scholarships"
        ],
        accommodation: [
          "Student residences: €300-600/month",
          "Shared apartments: €400-700/month",
          "Private studios: €500-900/month"
        ],
        visaSuccessRate: "86% (2023 data)"
      }
    },
    {
      id: "portugal",
      name: "Portugal",
      flag: "🇵🇹",
      highlights: [
        "Affordable tuition fees",
        "1-year job seeker visa",
        "Safe and welcoming",
        "EU access after studies"
      ],
      details: {
        educationCosts: [
          "Public Universities: €700-3,000/year",
          "Private: €3,000-12,000/year",
          "Living Costs: €500-900/month"
        ],
        workOpportunities: [
          "20 hrs/week during studies",
          "1-year residence permit after graduation",
          "Growing tech startup scene"
        ],
        visaProcess: [
          "University admission",
          "Proof of funds (€600/month)",
          "Health insurance",
          "Student visa application",
          "Processing Time: 1-3 months"
        ],
        scholarships: [
          "Portuguese Government Scholarships",
          "Erasmus+",
          "University scholarships"
        ],
        accommodation: [
          "Student housing: €250-450/month",
          "Shared apartments: €300-600/month",
          "Private studios: €500-800/month"
        ],
        visaSuccessRate: "89% (2023 data)"
      }
    },
    {
      id: "hungary",
      name: "Hungary",
      flag: "🇭🇺",
      highlights: [
        "Affordable education",
        "Central European location",
        "EU degree recognition",
        "Rich cultural heritage"
      ],
      details: {
        educationCosts: [
          "EU Students: Free (Hungarian programs)",
          "Non-EU: €2,000-6,000/year",
          "Living Costs: €400-800/month"
        ],
        workOpportunities: [
          "24 hrs/week during studies",
          "9-month residence permit after graduation",
          "Growing IT and medical sectors"
        ],
        visaProcess: [
          "University admission",
          "Proof of funds (€400/month)",
          "Health insurance",
          "Student visa application",
          "Processing Time: 1-2 months"
        ],
        scholarships: [
          "Stipendium Hungaricum",
          "Erasmus+",
          "University scholarships"
        ],
        accommodation: [
          "Student dorms: €150-300/month",
          "Shared apartments: €250-500/month",
          "Private studios: €400-700/month"
        ],
        visaSuccessRate: "90% (2023 data)"
      }
    },
    {
      id: "czech",
      name: "Czech Republic",
      flag: "🇨🇿",
      highlights: [
        "Free education (Czech programs)",
        "Central European hub",
        "EU degree recognition",
        "Affordable living costs"
      ],
      details: {
        educationCosts: [
          "Czech programs: Free",
          "English programs: €2,000-12,000/year",
          "Living Costs: €500-900/month"
        ],
        workOpportunities: [
          "20 hrs/week during studies",
          "9-month residence permit after graduation",
          "Strong manufacturing and IT sectors"
        ],
        visaProcess: [
          "University admission",
          "Proof of funds (€5,600/year)",
          "Health insurance",
          "Student visa application",
          "Processing Time: 2-3 months"
        ],
        scholarships: [
          "Czech Government Scholarships",
          "Erasmus+",
          "University scholarships"
        ],
        accommodation: [
          "Student dorms: €200-400/month",
          "Shared apartments: €300-600/month",
          "Private studios: €500-800/month"
        ],
        visaSuccessRate: "87% (2023 data)"
      }
    },
    {
      id: "estonia",
      name: "Estonia",
      flag: "🇪🇪",
      highlights: [
        "Digital society leader",
        "Affordable education",
        "6-month job seeker visa",
        "EU access after studies"
      ],
      details: {
        educationCosts: [
          "EU Students: Free (Estonian programs)",
          "Non-EU: €1,500-7,000/year",
          "Living Costs: €500-900/month"
        ],
        workOpportunities: [
          "20 hrs/week during studies",
          "6-month residence permit after graduation",
          "Strong IT and startup ecosystem"
        ],
        visaProcess: [
          "University admission",
          "Proof of funds (€450/month)",
          "Health insurance",
          "Student visa application",
          "Processing Time: 1-2 months"
        ],
        scholarships: [
          "Estonian Government Scholarships",
          "Erasmus+",
          "University scholarships"
        ],
        accommodation: [
          "Student housing: €200-400/month",
          "Shared apartments: €300-500/month",
          "Private studios: €400-700/month"
        ],
        visaSuccessRate: "92% (2023 data)"
      }
    }
  ];

  const toggleCountrySelection = (countryId) => {
    if (selectedCountries.includes(countryId)) {
      setSelectedCountries(selectedCountries.filter((id) => id !== countryId));
    } else {
      if (selectedCountries.length < 3) {
        setSelectedCountries([...selectedCountries, countryId]);
      }
    }
  };

  const selectedCountryData = () => {
    return topDestinations.filter((country) =>
      selectedCountries.includes(country.id)
    );
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer()}
      className="min-h-screen bg-transparent"
    >
      {/* Hero Section */}
      <section
        className="min-h-screen relative py-20 md:py-32 overflow-hidden career-hero"
        ref={heroRef}
      >
        <div className="container mx-auto px-6 relative z-10 h-full flex flex-col justify-center pb-28 md:pb-36">
          <motion.div
            ref={contentRef}
            variants={textVariant()}
            initial="hidden"
            animate="show"
            className="text-center max-w-4xl mx-auto"
          >
            <motion.span className="cursor-pointer mb-8 px-3 py-1.5 bg-[#004080] text-white font-semibold rounded-full shadow-lg inline-flex items-center justify-center transform hover:scale-105 transition-transform duration-300 group">
              Countries
            </motion.span>
            <motion.h1 className="text-4xl md:text-6xl font-bold mb-6 !text-black">
              Explore <span className="text-[#004080]">European</span> Study
              Destinations
            </motion.h1>
            <motion.p className="text-xl md:text-2xl text-[#004080] mb-8">
              Compare tuition fees, scholarships, visa rules, and job
              opportunities across Europe.
            </motion.p>
          </motion.div>
        </div>
        <div
          className="scroll-indicator"
          ref={scrollIndicatorRef}
          aria-hidden="true"
        >
          <div className="mouse"></div>
          <span className="scroll-indicator__label">Scroll to explore</span>
        </div>
      </section>

      {/* Country Grid Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <motion.div variants={textVariant()} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold !text-black mb-4">
              Top <span className="text-[#004080]">European</span> Study
              Destinations
            </h2>
            <p className="text-lg text-[#004080] max-w-2xl mx-auto">
              Compare the best European countries for international students in
              2024
            </p>
          </motion.div>

          {/* Comparison Mode Toggle */}
          <motion.div
            variants={fadeIn("up", "tween", 0.2, 0.5)}
            className="flex justify-center mb-8"
          >
            <div className="bg-white/30 p-1 rounded-full shadow-md border border-[#a0cbe8] backdrop-blur-sm">
              <button
                onClick={() => setComparisonMode(false)}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  !comparisonMode
                    ? "bg-[#004080] text-white"
                    : "text-[#004080] hover:bg-[#a0cbe8]/30"
                }`}
              >
                Browse Countries
              </button>
              <button
                onClick={() => {
                  if (selectedCountries.length > 0) {
                    setComparisonMode(true);
                  }
                }}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  comparisonMode
                    ? "bg-[#004080] text-white"
                    : selectedCountries.length > 0
                    ? "text-[#004080] hover:bg-[#a0cbe8]/30"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                disabled={selectedCountries.length === 0}
              >
                Compare ({selectedCountries.length}/3)
              </button>
            </div>
          </motion.div>

          {comparisonMode ? (
            <ComparisonView countries={selectedCountryData()} />
          ) : (
            <motion.div
              variants={staggerContainer()}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {topDestinations.map((country, index) => (
                // Modify the structure of each country card within the grid
                <motion.div
                  key={country.id}
                  variants={fadeIn("up", "tween", index * 0.1, 0.5)}
                  whileHover={{
                    y: -10,
                    boxShadow: "0 15px 30px rgba(0, 64, 128, 0.2)"
                  }}
                  className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border-2 transition-all duration-300 ${
                    selectedCountries.includes(country.id)
                      ? "border-[#ffd700]"
                      : "border-transparent"
                  } hover:shadow-xl flex flex-col`} // Set flex-col for consistent layout
                >
                  {/* Country name and button stay at the bottom */}
                  <div className="flex flex-col justify-between h-full p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-[#004080]">
                        {country.name}
                      </h3>
                      <button
                        onClick={() => toggleCountrySelection(country.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedCountries.includes(country.id)
                            ? "bg-[#ff0000] text-[#ffffff] hover:bg-[#ff0005]/80"
                            : "bg-[#ffd700] text-[#004080] hover:bg-[#ffd705]/80"
                        }`}
                      >
                        {selectedCountries.includes(country.id)
                          ? "Remove"
                          : "Compare"}
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {country.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start">
                          <svg
                            className="h-5 w-5 text-[#ffd700] mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-[#004080]">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() =>
                        setActiveDetail(
                          activeDetail === country.id ? null : country.id
                        )
                      }
                      className="mt-6 w-full bg-[#004080]/10 hover:bg-[#004080]/20 text-[#004080] font-medium py-2 px-4 rounded-lg transition-colors duration-300"
                    >
                      {activeDetail === country.id
                        ? "Hide Details"
                        : "View Details"}
                    </button>

                    {/* Details section that only expands for the selected card */}
                    {activeDetail === country.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 overflow-hidden"
                      >
                        <div className="pt-4 border-t border-[#a0cbe8]">
                          <h4 className="font-semibold text-[#004080] mb-2">
                            Visa Success Rate
                          </h4>
                          <p className="text-[#004080]">
                            {country.details.visaSuccessRate}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </motion.div>
  );
};

const ComparisonView = ({ countries }) => {
  if (countries.length < 2) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 bg-[#a0cbe8]/20 rounded-xl border-2 border-dashed border-[#a0cbe8] backdrop-blur-sm"
      >
        <div className="text-[#004080] mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-[#004080] mb-2">
          Select 2-3 countries to compare
        </h3>
        <p className="text-[#004080]">
          Click the "Compare" button on country cards to add them to comparison
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-[#a0cbe8]"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#a0cbe8]">
              <th className="py-4 px-6 text-left font-semibold text-[#004080] bg-[#a0cbe8]/30">
                Criteria
              </th>
              {countries.map((country) => (
                <th
                  key={country.id}
                  className="py-4 px-6 text-center font-semibold text-[#004080] bg-[#a0cbe8]/30"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-3xl mb-2">{country.flag}</span>
                    <span>{country.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#a0cbe8]/30">
              <td className="py-4 px-6 font-medium text-[#004080]">
                Tuition Fees
              </td>
              {countries.map((country) => (
                <td
                  key={country.id}
                  className="py-4 px-6 text-center text-[#004080]"
                >
                  {country.details.educationCosts[0]}
                </td>
              ))}
            </tr>
            <tr className="border-b border-[#a0cbe8]/30 bg-[#a0cbe8]/10">
              <td className="py-4 px-6 font-medium text-[#004080]">
                Work Rights
              </td>
              {countries.map((country) => (
                <td
                  key={country.id}
                  className="py-4 px-6 text-center text-[#004080]"
                >
                  {country.details.workOpportunities[0]}
                </td>
              ))}
            </tr>
            <tr className="border-b border-[#a0cbe8]/30">
              <td className="py-4 px-6 font-medium text-[#004080]">
                Visa Process Time
              </td>
              {countries.map((country) => (
                <td
                  key={country.id}
                  className="py-4 px-6 text-center text-[#004080]"
                >
                  {country.details.visaProcess[
                    country.details.visaProcess.length - 1
                  ].replace("Processing Time: ", "")}
                </td>
              ))}
            </tr>
            <tr className="border-b border-[#a0cbe8]/30 bg-[#a0cbe8]/10">
              <td className="py-4 px-6 font-medium text-[#004080]">
                Post-Study Options
              </td>
              {countries.map((country) => (
                <td
                  key={country.id}
                  className="py-4 px-6 text-center text-[#004080]"
                >
                  {country.highlights.find(
                    (h) =>
                      h.includes("Post-Study") || h.includes("after graduation")
                  ) || "Varies"}
                </td>
              ))}
            </tr>
            <tr className="border-b border-[#a0cbe8]/30">
              <td className="py-4 px-6 font-medium text-[#004080]">
                Scholarships
              </td>
              {countries.map((country) => (
                <td
                  key={country.id}
                  className="py-4 px-6 text-center text-[#004080]"
                >
                  {country.details.scholarships[0]}
                </td>
              ))}
            </tr>
            <tr className="border-b border-[#a0cbe8]/30 bg-[#a0cbe8]/10">
              <td className="py-4 px-6 font-medium text-[#004080]">
                Accommodation
              </td>
              {countries.map((country) => (
                <td
                  key={country.id}
                  className="py-4 px-6 text-center text-[#004080]"
                >
                  {country.details.accommodation[0]}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-4 px-6 font-medium text-[#004080]">
                Visa Success Rate
              </td>
              {countries.map((country) => (
                <td
                  key={country.id}
                  className="py-4 px-6 text-center text-[#004080]"
                >
                  {country.details.visaSuccessRate}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default Countries;
