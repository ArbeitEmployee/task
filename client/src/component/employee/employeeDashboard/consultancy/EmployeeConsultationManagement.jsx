import React, { useState, useEffect } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiSearch,
  FiChevronDown,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCheck,
  FiRefreshCw,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

const EmployeeConsultationManagement = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedConsultation, setExpandedConsultation] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch consultations assigned to the logged-in employee
  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("empToken");
        const response = await axios.get(
          "http://localhost:3500/api/employee/consultations",
          {
            headers: {
              "x-auth-token": token,
            },
          }
        );
        setConsultations(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load consultations");
        toast.error("Failed to load consultations");
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, []);

  // Update consultation status
  const handleStatusUpdate = async (consultationId, newStatus) => {
    try {
      setIsUpdatingStatus(true);
      const token = localStorage.getItem("empToken");
      const response = await axios.put(
        `http://localhost:3500/api/employee/consultations/${consultationId}/status`,
        { status: newStatus },
        {
          headers: {
            "x-auth-token": token,
          },
        }
      );

      // Update local state
      setConsultations((prev) =>
        prev.map((cons) =>
          cons._id === consultationId ? response.data.data : cons
        )
      );
      toast.success("Status updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Filter consultations based on search term and status filter
  const filteredConsultations = consultations.filter((consultation) => {
    const matchesSearch =
      consultation.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (consultation.phone &&
        consultation.phone.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || consultation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FiClock className="text-yellow-500" />;
      case "assigned":
        return <FiRefreshCw className="text-blue-500" />;
      case "completed":
        return <FiCheckCircle className="text-green-500" />;
      case "cancelled":
        return <FiXCircle className="text-red-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-6 max-w-md bg-white rounded-xl shadow-md">
          <div className="text-red-500 text-center">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          My Consultations
        </h1>
        <p className="text-gray-600">
          Manage the consultations assigned to you
        </p>
      </motion.div>

      {/* Stats and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Search Bar */}
        <div className="md:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search consultations..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <FiChevronDown className="text-gray-400" />
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center justify-center">
          <span className="text-gray-600 mr-1">Showing</span>
          <span className="font-medium text-gray-900">
            {filteredConsultations.length}
          </span>
          <span className="text-gray-600 ml-1">
            of {consultations.length} consultations
          </span>
        </div>
      </div>

      {/* Consultations List */}
      <div className="space-y-4">
        {filteredConsultations.length > 0 ? (
          filteredConsultations.map((consultation) => (
            <motion.div
              key={consultation._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div
                className="p-4 md:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() =>
                  setExpandedConsultation(
                    expandedConsultation === consultation._id
                      ? null
                      : consultation._id
                  )
                }
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  {/* Client Info */}
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                      {consultation.fullName.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {consultation.fullName}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <FiMail className="mr-1" />
                        <span>{consultation.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="mt-3 md:mt-0 flex items-center justify-between md:justify-end space-x-4">
                    <div className="flex items-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          consultation.status
                        )} flex items-center`}
                      >
                        {getStatusIcon(consultation.status)}
                        <span className="ml-1">
                          {consultation.status.charAt(0).toUpperCase() +
                            consultation.status.slice(1)}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className={`p-1 rounded-full ${
                          expandedConsultation === consultation._id
                            ? "bg-gray-200"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedConsultation(
                            expandedConsultation === consultation._id
                              ? null
                              : consultation._id
                          );
                        }}
                      >
                        <FiChevronDown
                          className={`text-gray-500 transition-transform ${
                            expandedConsultation === consultation._id
                              ? "transform rotate-180"
                              : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedConsultation === consultation._id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-4 md:px-6 pb-4 md:pb-6 border-t border-gray-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Contact Information
                        </h4>
                        <div className="mt-2 space-y-2">
                          <p className="flex items-center text-gray-700">
                            <FiPhone className="mr-2 text-gray-400" />
                            {consultation.phone || "Not provided"}
                          </p>
                          <p className="flex items-center text-gray-700">
                            <FiCalendar className="mr-2 text-gray-400" />
                            Submitted:{" "}
                            {new Date(
                              consultation.createdAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Study Preferences
                        </h4>
                        <div className="mt-2 space-y-2">
                          <p className="text-gray-700">
                            <span className="font-medium">Country:</span>{" "}
                            {consultation.country}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Study Level:</span>{" "}
                            {consultation.studyLevel}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Intake:</span>{" "}
                            {consultation.intake}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Sponsor:</span>{" "}
                            {consultation.sponsor}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Additional Information
                      </h4>
                      <div className="mt-2">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {consultation.message ||
                            "No additional message provided"}
                        </p>
                      </div>

                      {/* Status Update */}
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">
                          Update Status
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {["completed", "cancelled"].map((status) => (
                            <button
                              key={status}
                              onClick={() =>
                                handleStatusUpdate(consultation._id, status)
                              }
                              disabled={
                                isUpdatingStatus ||
                                consultation.status === status
                              }
                              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center ${
                                consultation.status === status
                                  ? "bg-green-100 text-green-800 cursor-default"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                              } ${
                                isUpdatingStatus
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {status === "completed" ? (
                                <>
                                  <FiCheck className="mr-1" />
                                  Mark as Completed
                                </>
                              ) : (
                                <>
                                  <FiXCircle className="mr-1" />
                                  Mark as Cancelled
                                </>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
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
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No consultations found
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "You don't have any consultations assigned yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeConsultationManagement;
