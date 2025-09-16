import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FiMap, FiType, FiFileText, FiX } from "react-icons/fi";

function CountryCreate() {
  const [criteriaOptions, setCriteriaOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    description: "",
    criteria: ""
  });
  const [files, setFiles] = useState({
    flag: null
  });
  const [errors, setErrors] = useState({
    name: "",
    criteria: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem("token");
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const fetchCriterias = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          "http://localhost:3500/api/criteri/create",
          { headers: authHeaders }
        );
        setCriteriaOptions(data);
      } catch (err) {
        toast.error(
          err.response?.data?.message ||
            err.message ||
            "Failed to load criterias"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCriterias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validation function
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "name":
        if (!value) error = "Country name is required";
        break;
      case "criteria":
        if (!value) error = "Criteria selection is required";
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) validateField(name, value);
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, or SVG images are allowed");
      return;
    }
    
    // Validate file size (max 5MB for flags)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Flag image must be less than 5MB");
      return;
    }
    
    setFiles((prev) => ({ ...prev, [name]: file }));
  };

  const validateForm = () => {
    let isValid = true;
    isValid = validateField("name", form.name) && isValid;
    isValid = validateField("criteria", form.criteria) && isValid;
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix all errors before submitting");
      return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading("Creating country...");
    
    try {
      // Prepare form data for image upload
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("criteria", form.criteria);
      
      // Add flag file if exists
      if (files.flag) {
        formData.append("flag", files.flag);
      }
      
      await axios.post(
        "http://localhost:3500/api/auth/countries",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...authHeaders,
          },
        }
      );
      
      // Reset form
      setForm({
        name: "",
        description: "",
        criteria: ""
      });
      setFiles({
        flag: null
      });
      
      toast.success("Country created successfully", { id: toastId });
    } catch (err) {
      let errorMessage = "Failed to create country";
      if (err.response) {
        if (err.response.status === 413) {
          errorMessage = "File too large (max 5MB)";
        } else if (err.response.status === 415) {
          errorMessage = "Unsupported file type";
        } else if (err.response.data) {
          errorMessage = Array.isArray(err.response.data.message)
            ? err.response.data.message.join(", ")
            : err.response.data.message ||
              err.response.data.error ||
              errorMessage;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-gray-200 border-t-2 border-t-black rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading criterias...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col items-center p-6"
    >
      <div className="w-full max-w-full">
        <div className="w-full mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Country Creation
          </h1>
          <p className="text-gray-600 mt-2">
            Create a new country with criteria and description
          </p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-200"
        >
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Create New Country
            </h2>
            <p className="text-gray-600">
              Fill the form to add a new country
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Country Name */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FiMap className="mr-2 text-gray-500" /> Country Name *
              </label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                onBlur={() => validateField("name", form.name)}
                placeholder="Enter country name"
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.name ? "border-red-500" : "border-gray-300"
                } focus:border-gray-500 transition-all`}
              />
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500"
                >
                  {errors.name}
                </motion.p>
              )}
            </div>

            {/* Criteria Dropdown */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FiType className="mr-2 text-gray-500" /> Criteria *
              </label>
              <select
                name="criteria"
                value={form.criteria}
                onChange={handleChange}
                onBlur={() => validateField("criteria", form.criteria)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.criteria ? "border-red-500" : "border-gray-300"
                } focus:border-gray-500 transition-all text-gray-900`}
              >
                <option value="">Select a criteria</option>
                {criteriaOptions.map((criteria) => (
                  <option key={criteria._id} value={criteria._id}>
                    {criteria.name}
                  </option>
                ))}
              </select>
              {errors.criteria && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500"
                >
                  {errors.criteria}
                </motion.p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FiFileText className="mr-2 text-gray-500" /> Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-gray-500 transition-all"
                placeholder="Enter country description"
                rows="3"
              />
            </div>

            {/* Flag Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Flag Image (JPG/PNG/SVG, max 5MB)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[60px] text-center hover:bg-gray-50 transition-colors">
                {files.flag ? (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 text-sm truncate max-w-[180px]">
                      {files.flag.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => ({ ...prev, flag: null }))}
                      className="text-gray-400 hover:text-red-500 ml-2 transition-colors duration-200"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <p className="text-gray-500 text-sm mb-1">
                      Click to upload flag image
                    </p>
                    <p className="text-xs text-gray-400">JPG, PNG or SVG</p>
                    <input
                      type="file"
                      name="flag"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.svg"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="pt-4">
              <p className="text-sm text-gray-500 mb-4">* Mandatory fields</p>
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium text-white ${
                    isSubmitting
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-gray-700 hover:bg-gray-700"
                  } transition-all shadow-md flex items-center justify-center`}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create Country"
                  )}
                </motion.button>              
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default CountryCreate;