// index.js
import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AdminProvider } from "./context/AdminContext.jsx";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AdminProvider>
      <App />
    </AdminProvider>
  </StrictMode>
);
