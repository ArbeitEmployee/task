/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");
  const userInfo = JSON.parse(localStorage.getItem("admin"));

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${base_url}/api/admin/profile/${userInfo._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUserData(response.data.profile);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && userInfo?._id) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const clearUserData = () => {
    setUserData(null);
    setError(null);
    setLoading(false);
  };

  return (
    <AdminContext.Provider
      value={{
        userData,
        loading,
        error,
        fetchUserProfile,
        clearUserData,
        role: userData?.role || localStorage.getItem("role")
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;
