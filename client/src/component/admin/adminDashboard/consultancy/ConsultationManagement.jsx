import React, { useState, useEffect } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiBook,
  FiDollarSign,
} from "react-icons/fi";
const ConsultationManagement = () => {
  const [consultations, setConsultations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentConsultation, setCurrentConsultation] = useState(null);
  // Fetch consultations
  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:3500/api/admin/consultancy",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setConsultations(response.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch consultations"
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:3500/api/admin/employees",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setEmployees(
          response.data.data.filter((emp) => emp.role === "consultant")
        );
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };

    fetchConsultations();
    fetchEmployees();
  }, []);

  const handleAssignConsultation = async () => {
    if (!selectedEmployee || !selectedConsultation) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:3500/api/admin/consultancy/${selectedConsultation}/assign`,
        { employeeId: selectedEmployee },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setConsultations((prev) =>
        prev.map((cons) =>
          cons._id === selectedConsultation
            ? {
                ...cons,
                assignedTo: employees.find((e) => e._id === selectedEmployee),
                status: "assigned",
              }
            : cons
        )
      );

      setAssignModalOpen(false);
      setSelectedConsultation(null);
      setSelectedEmployee("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign consultation");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-gray-800 text-gray-100";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const handleViewConsultation = (consultation) => {
    setCurrentConsultation(consultation);
    setViewModalOpen(true);
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
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
            className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition duration-200"
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
          Consultation Management
        </h1>
        <p className="text-gray-600">
          Manage and assign client consultations to your team
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {["pending", "assigned", "completed", "cancelled"].map((status) => (
          <motion.div
            key={status}
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  {status}
                </p>
                <p className="text-2xl font-semibold text-gray-800">
                  {consultations.filter((c) => c.status === status).length}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  status
                )}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Consultations Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Study Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {consultations.map((consultation) => (
                <tr
                  key={consultation._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold">
                        {consultation.fullName.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {consultation.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(
                            consultation.createdAt
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {consultation.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      {consultation.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {consultation.country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {consultation.studyLevel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        consultation.status
                      )}`}
                    >
                      {consultation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {consultation.assignedTo ? (
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                          {consultation.assignedTo.username.charAt(0)}
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900">
                            {consultation.assignedTo.username}
                          </div>
                          <div className="text-xs text-gray-500">
                            {consultation.assignedTo.email}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">
                        Not assigned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {consultation.status === "pending" && (
                      <button
                        onClick={() => {
                          setSelectedConsultation(consultation._id);
                          setAssignModalOpen(true);
                        }}
                        className="text-gray-600 hover:text-gray-900 mr-3"
                      >
                        Assign
                      </button>
                    )}
                    <button
                      onClick={() => handleViewConsultation(consultation)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      {viewModalOpen && currentConsultation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200/50"
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 p-6 flex justify-between items-start">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-600 to-indigo-600 bg-clip-text">
                  Consultation Details
                </h3>
                <div className="flex items-center mt-2 space-x-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      currentConsultation.status
                    )}`}
                  >
                    {currentConsultation.status.charAt(0).toUpperCase() +
                      currentConsultation.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(currentConsultation.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Client Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 md:p-6">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FiUser className="mr-2 text-gray-500" />
                    Client Information
                  </h4>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">
                        Full Name
                      </p>
                      <p className="text-gray-900 font-medium">
                        {currentConsultation.fullName}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <a
                        href={`mailto:${currentConsultation.email}`}
                        className="text-gray-600 hover:text-gray-800 font-medium flex items-center"
                      >
                        <FiMail className="mr-1.5" />
                        {currentConsultation.email}
                      </a>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <a
                        href={`tel:${currentConsultation.phone}`}
                        className="text-gray-900 font-medium flex items-center"
                      >
                        <FiPhone className="mr-1.5" />
                        {currentConsultation.phone || "Not provided"}
                      </a>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">
                        Submission Date
                      </p>
                      <p className="text-gray-900 font-medium flex items-center">
                        <FiCalendar className="mr-1.5" />
                        {new Date(
                          currentConsultation.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Study Details Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 md:p-6">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FiBook className="mr-2 text-indigo-500" />
                    Study Preferences
                  </h4>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">
                        Target Country
                      </p>
                      <p className="text-gray-900 font-medium">
                        {currentConsultation.country}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">
                        Study Level
                      </p>
                      <p className="text-gray-900 font-medium">
                        {currentConsultation.studyLevel}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">
                        Preferred Intake
                      </p>
                      <p className="text-gray-900 font-medium">
                        {currentConsultation.intake}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">
                        Funding Source
                      </p>
                      <p className="text-gray-900 font-medium">
                        {currentConsultation.sponsor}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultant Assignment Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 md:p-6">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-purple-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    Consultant Assignment
                  </h4>
                  <div className="mt-4">
                    {currentConsultation.assignedTo ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                            {currentConsultation.assignedTo.username
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-lg font-semibold text-gray-900 truncate">
                            {currentConsultation.assignedTo.username}
                          </h5>
                          <p className="text-gray-600 truncate flex items-center">
                            <FiMail className="mr-1.5 flex-shrink-0" />
                            {currentConsultation.assignedTo.email}
                          </p>
                          {currentConsultation.assignedTo.phoneNumber && (
                            <p className="text-gray-600 truncate flex items-center mt-1">
                              <FiPhone className="mr-1.5 flex-shrink-0" />
                              {currentConsultation.assignedTo.phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">
                          No consultant assigned yet
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          Assign a consultant to handle this case
                        </p>
                        <button
                          onClick={() => {
                            setViewModalOpen(false);
                            setSelectedConsultation(currentConsultation._id);
                            setAssignModalOpen(true);
                          }}
                          className="mt-3 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Assign Consultant
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Notes Card */}
              {currentConsultation.message && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5 md:p-6">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-amber-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Additional Notes
                    </h4>
                    <div className="mt-4">
                      <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg">
                        {currentConsultation.message}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
      {/* Assign Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Consultation
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Consultant
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a consultant</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.username} ({employee.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setAssignModalOpen(false);
                    setSelectedConsultation(null);
                    setSelectedEmployee("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignConsultation}
                  disabled={!selectedEmployee}
                  className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                    selectedEmployee
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-indigo-300 cursor-not-allowed"
                  }`}
                >
                  Assign
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ConsultationManagement;
