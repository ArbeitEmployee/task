import React, { useState, useEffect } from "react";

const ScrollButtons = () => {
  const [showUpButton, setShowUpButton] = useState(false);
  const [showDownButton, setShowDownButton] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPosition = window.scrollY;

      // Show "Scroll to Top" button when scrolling down
      setShowUpButton(scrollPosition > 0);

      // Show "Scroll to Bottom" button when near the bottom of the page
      setShowDownButton(scrollPosition + windowHeight < documentHeight - 100);
    };

    window.addEventListener("scroll", handleScroll);
    // Initial check to set the button visibility
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth"
    });
  };

  return (
    <>
      {showUpButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 focus:outline-none"
          style={{
            background: "linear-gradient(135deg, #004080 0%, #a0cbe8 100%)",
            boxShadow: "0 4px 15px rgba(0, 64, 128, 0.3)"
          }}
          aria-label="Scroll to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      )}

      {showDownButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 focus:outline-none"
          style={{
            background: "linear-gradient(135deg, #ffd700 0%, #ffd705 100%)",
            boxShadow: "0 4px 15px rgba(255, 215, 0, 0.3)"
          }}
          aria-label="Scroll to bottom"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-black"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}
    </>
  );
};

export default ScrollButtons;
