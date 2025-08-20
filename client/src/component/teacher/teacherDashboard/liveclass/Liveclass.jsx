/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiEdit,
  FiEye,
  FiSearch,
  FiFilter,
  FiX,
  FiPlus,
  FiCheck,
  FiXCircle,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { MdDelete } from "react-icons/md";

const Liveclass = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [gradingData, setGradingData] = useState({});
  const [totalScore, setTotalScore] = useState(0);
  const [maxTotalScore, setMaxTotalScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [passed, setPassed] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  // Get teacher ID from localStorage
  const teacherData = JSON.parse(localStorage.getItem("teacherData"));
  const teacherId = teacherData?._id;

  // Fetch all live class attendance data
  const fetchLiveClassAttendance = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${base_url}/api/teacher/live-class-attendance`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
            teacher_id: teacherId,
          },
        }
      );
      setSubmissions(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching live class attendance:", error);
      toast.error("Failed to fetch live class attendance");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveClassAttendance();
  }, []);

  // Mark live class as completed for all students
  const completeLiveClass = async (courseId, contentId) => {
    try {
      const response = await axios.post(
        `${base_url}/api/teacher/complete-live-class/${courseId}/${contentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
            teacher_id: teacherId,
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchLiveClassAttendance();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error completing live class:", error);
      toast.error(
        error.response?.data?.message || "Failed to complete live class"
      );
    }
  };

  // Update individual student attendance
  const updateStudentAttendance = async (
    courseId,
    contentId,
    studentId,
    completed
  ) => {
    try {
      const response = await axios.post(
        `${base_url}/api/teacher/update-live-class-progress/${courseId}/${contentId}/${studentId}`,
        { completed, timeSpent: 60 }, // Default to 60 minutes attendance
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
            teacher_id: teacherId,
          },
        }
      );

      if (response.data.success) {
        toast.success(
          `Attendance ${completed ? "marked" : "unmarked"} for student`
        );
        fetchLiveClassAttendance();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error updating student attendance:", error);
      toast.error(
        error.response?.data?.message || "Failed to update attendance"
      );
    }
  };

  // Filter submissions based on search and filter
  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.contentItem.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "ungraded" && !submission.completed) ||
      (filter === "graded" && submission.completed);

    return matchesSearch && matchesFilter;
  });

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // View submission details
  const viewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="flex w-full h-[100vh] bg-white overflow-hidden">
        <div className="flex-1 h-full overflow-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen"
          >
            <div className="w-full mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">
                  Live Class Attendance
                </h1>
                <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
                  <div className="relative w-full md:w-64">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search attendance..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="w-full md:w-auto border border-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:border-gray-500"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Records</option>
                    <option value="ungraded">Pending Attendance</option>
                    <option value="graded">Completed Attendance</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Live Class
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map((submission, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {submission.student.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {submission.student.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {submission.courseTitle}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {submission.contentItem.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(
                                  submission.contentItem.schedule
                                ).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  submission.completed
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {submission.completed ? "Completed" : "Pending"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => viewSubmission(submission)}
                                  className="text-gray-600 hover:text-gray-900 flex items-center"
                                >
                                  <FiEye className="mr-1" /> View
                                </button>
                                {!submission.completed && (
                                  <button
                                    onClick={() =>
                                      updateStudentAttendance(
                                        submission.courseId,
                                        submission.contentItem._id,
                                        submission.student._id,
                                        true
                                      )
                                    }
                                    className="text-green-600 hover:text-green-900 flex items-center"
                                  >
                                    <FiCheck className="mr-1" /> Mark Present
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-6 py-4 text-center text-sm text-gray-500"
                          >
                            No attendance records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Complete All Button */}
              {filteredSubmissions.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      // Get unique course-content pairs
                      const uniquePairs = {};
                      filteredSubmissions.forEach((sub) => {
                        const key = `${sub.courseId}-${sub.contentItem._id}`;
                        if (!uniquePairs[key]) {
                          uniquePairs[key] = {
                            courseId: sub.courseId,
                            contentId: sub.contentItem._id,
                            title: sub.contentItem.title,
                          };
                        }
                      });

                      // For each unique pair, complete the live class
                      Object.values(uniquePairs).forEach((pair) => {
                        completeLiveClass(pair.courseId, pair.contentId);
                      });
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
                  >
                    <FiCheck className="mr-2" /> Mark All as Completed
                  </button>
                </div>
              )}
            </div>

            {/* Attendance Details Modal */}
            {isModalOpen && selectedSubmission && (
              <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[1000] p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                  {/* Modal Header */}
                  <div className="bg-gray-800 text-white p-4 rounded-t-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold">
                          Attendance Details:{" "}
                          {selectedSubmission.contentItem.title}
                        </h2>
                        <p className="text-sm text-gray-300 mt-1">
                          Student: {selectedSubmission.student.name} (
                          {selectedSubmission.student.email})
                        </p>
                      </div>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="text-gray-300 hover:text-white"
                      >
                        <FiX size={24} />
                      </button>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Course
                        </h3>
                        <p className="text-lg font-medium text-gray-800">
                          {selectedSubmission.courseTitle}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Class Schedule
                        </h3>
                        <p className="text-lg font-medium text-gray-800">
                          {new Date(
                            selectedSubmission.contentItem.schedule
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="mb-3 md:mb-0">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Attendance Status
                          </h3>
                          <div className="flex items-center mt-1">
                            <span
                              className={`text-xl font-bold ${
                                selectedSubmission.completed
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {selectedSubmission.completed
                                ? "Completed"
                                : "Pending"}
                            </span>
                            {selectedSubmission.lastAccessed && (
                              <span className="ml-3 text-sm text-gray-600">
                                Last accessed:{" "}
                                {new Date(
                                  selectedSubmission.lastAccessed
                                ).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              updateStudentAttendance(
                                selectedSubmission.courseId,
                                selectedSubmission.contentItem._id,
                                selectedSubmission.student._id,
                                !selectedSubmission.completed
                              );
                              setIsModalOpen(false);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm flex items-center ${
                              selectedSubmission.completed
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                : "bg-green-100 text-green-800 hover:bg-green-200"
                            }`}
                          >
                            {selectedSubmission.completed ? (
                              <>
                                <FiXCircle className="mr-2" /> Mark as Pending
                              </>
                            ) : (
                              <>
                                <FiCheck className="mr-2" /> Mark as Completed
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="p-4 bg-gray-50">
                          <h3 className="font-medium text-gray-800">
                            Class Details
                          </h3>
                        </div>
                        <div className="p-4 bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-1">
                                Duration
                              </h4>
                              <p className="text-sm text-gray-800">
                                {selectedSubmission.contentItem.duration || 60}{" "}
                                minutes
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-1">
                                Time Spent
                              </h4>
                              <p className="text-sm text-gray-800">
                                {selectedSubmission.timeSpent || 0} minutes
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">
                              Description
                            </h4>
                            <p className="text-sm text-gray-800">
                              {selectedSubmission.contentItem.description ||
                                "No description provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Liveclass;
