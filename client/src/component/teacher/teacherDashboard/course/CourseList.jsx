/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiEdit, FiEye, FiSearch, FiFilter, FiX, FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { MdDelete } from "react-icons/md";
import DOMPurify from "dompurify";

const CourseList = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [viewingCourse, setViewingCourse] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Get teacher ID from localStorage
  const teacherData = JSON.parse(localStorage.getItem("teacherData"));
  const teacherId = teacherData?._id;

  useEffect(() => {
    if (teacherId) {
      fetchCourses();
    }
  }, [teacherId]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${base_url}/api/teacher/my-courses/${teacherId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
          },
        }
      );
      setCourses(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to fetch courses");
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "free" && course.type === "free") ||
      (filter === "premium" && course.type === "premium");
    return matchesSearch && matchesFilter;
  });

  const handleEdit = (course) => {
    navigate(`/teacher/edit-course/${course._id}`);
  };

  const handleDeleteClick = (courseId) => {
    setCourseToDelete(courseId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;

    try {
      await axios.delete(
        `${base_url}/api/teacher/delete-content/${courseToDelete}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
          },
        }
      );
      toast.success("Course deleted successfully");
      fetchCourses(); // Refresh the course list
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    } finally {
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
    }
  };

  return (
    <div className=" min-h-screen flex items-center justify-center">
      <div className="flex w-full overflow-hidden">
        {/* Main Content Section */}
        <div className="flex-1 h-full overflow-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen"
          >
            <div className="max-w-full mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">My Courses</h1>
              </div>

              <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 hover:border-gray-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FiFilter className="text-gray-400" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-500 hover:border-gray-500"
                    >
                      <option value="all">All Courses</option>
                      <option value="free">Free Courses</option>
                      <option value="premium">Premium Courses</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border-[1px] border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs md:text-sm font-[700] text-gray-500 uppercase tracking-wider">
                          Course
                        </th>
                        <th className="px-6 py-3 text-left text-xs md:text-sm font-[700] text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs md:text-sm font-[700] text-gray-500 uppercase tracking-wider">
                          Students
                        </th>
                        <th className="px-6 py-3 text-left text-xs md:text-sm font-[700] text-gray-500 uppercase tracking-wider">
                          Rating
                        </th>
                        <th className="px-6 py-3 text-left text-xs md:text-sm font-[700] text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => (
                          <tr key={course._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img
                                    className="h-10 w-10 rounded-md object-cover"
                                    src={
                                      course.thumbnail?.path
                                        ? `${base_url}/uploads/courses/${course.thumbnail.filename}`
                                        : "/default-thumbnail.jpg"
                                    }
                                    alt={course.title}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {course.title}
                                  </div>
                                  <div
                                    className="text-sm text-gray-500 line-clamp-1 overflow-hidden"
                                    dangerouslySetInnerHTML={{
                                      __html: DOMPurify.sanitize(
                                        course.description
                                      ),
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  course.type === "premium"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {course.type === "premium"
                                  ? `$${course.price}`
                                  : "Free"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {course.studentsEnrolled?.length || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-gray-900 mr-2">
                                  {course.averageRating?.toFixed(1) || "0.0"}
                                </div>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <svg
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i <
                                        Math.floor(course.averageRating || 0)
                                          ? "text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(course)}
                                  className="bg-blue-500 rounded-[5px] cursor-pointer text-white px-[8px] py-[6px]"
                                  title="Edit"
                                >
                                  <FiEdit className="text-[15px]" />
                                </button>
                                <button
                                  onClick={() => {
                                    setViewingCourse(course);
                                    setIsViewModalOpen(true);
                                  }}
                                  className="bg-green-500 rounded-[5px] cursor-pointer text-white px-[8px] py-[6px]"
                                  title="View"
                                >
                                  <FiEye className="text-[15px]" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(course._id)}
                                  className="bg-red-500 cursor-pointer rounded-[5px] text-white px-[8px] py-[6px]"
                                  title="Delete"
                                >
                                  <MdDelete className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            No courses found. Create your first course to get
                            started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* View Course Modal */}
            {isViewModalOpen && viewingCourse && (
              <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                >
                  <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                      Course Details: {viewingCourse.title}
                    </h2>
                    <button
                      onClick={() => setIsViewModalOpen(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FiX className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Course Thumbnail */}
                      <div className="flex justify-center">
                        <img
                          className="h-48 w-full object-cover rounded-lg"
                          src={
                            viewingCourse.thumbnail?.path
                              ? `${base_url}/uploads/courses/${viewingCourse.thumbnail.filename}`
                              : "/default-thumbnail.jpg"
                          }
                          alt={viewingCourse.title}
                        />
                      </div>

                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2 border-gray-200">
                          Basic Information
                        </h3>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">
                            Title
                          </h4>
                          <p className="text-gray-800">{viewingCourse.title}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">
                            Description
                          </h4>
                          <p className="text-gray-800 whitespace-pre-line">
                            {viewingCourse.description}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">
                              Type
                            </h4>
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                viewingCourse.type === "premium"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {viewingCourse.type === "premium"
                                ? `Premium ($${viewingCourse.price})`
                                : "Free"}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">
                              Students Enrolled
                            </h4>
                            <p className="text-gray-800">
                              {viewingCourse.studentsEnrolled?.length || 0}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">
                            Rating
                          </h4>
                          <div className="flex items-center">
                            <div className="text-lg font-medium text-gray-900 mr-2">
                              {viewingCourse.averageRating?.toFixed(1) || "0.0"}
                            </div>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i <
                                    Math.floor(viewingCourse.averageRating || 0)
                                      ? "text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Course Content */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">
                          Course Content
                        </h3>
                        {viewingCourse.content?.length > 0 ? (
                          <div className="space-y-3">
                            {viewingCourse.content.map((item, index) => (
                              <div
                                key={item._id || item.id}
                                className="border border-gray-200 rounded-lg p-4"
                              >
                                <h4 className="font-medium">
                                  {index + 1}. {item.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {item.type === "tutorial"
                                    ? "Tutorial"
                                    : item.type === "quiz"
                                    ? "Quiz"
                                    : "Live Class"}
                                </p>
                                {item.description && (
                                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                                    {item.description}
                                  </p>
                                )}
                                {item.type === "tutorial" && (
                                  <div className="mt-2">
                                    {viewingCourse.type === "free" ? (
                                      <a
                                        href={item.youtubeLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-sm"
                                      >
                                        Watch on YouTube
                                      </a>
                                    ) : (
                                      <p className="text-sm text-gray-700">
                                        Premium content available
                                      </p>
                                    )}
                                  </div>
                                )}
                                {item.type === "live" && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-sm text-gray-700">
                                      <span className="font-medium">
                                        Scheduled:
                                      </span>{" "}
                                      {new Date(item.schedule).toLocaleString()}
                                    </p>
                                    <a
                                      href={item.meetingLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-sm"
                                    >
                                      Join Meeting
                                    </a>
                                  </div>
                                )}
                                {item.type === "quiz" && (
                                  <div className="mt-2">
                                    <p className="text-sm text-gray-700">
                                      {item.questions?.length || 0} questions
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">
                            No content available for this course.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <button
                        onClick={() => setIsViewModalOpen(false)}
                        className="px-6 py-2 rounded-lg font-medium text-white cursor-pointer bg-gray-600 hover:bg-gray-700"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
              <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-xl shadow-lg w-full max-w-md"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-800">
                        Confirm Deletion
                      </h3>
                      <button
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FiX className="h-6 w-6" />
                      </button>
                    </div>

                    <p className="text-gray-600 mb-6">
                      Are you sure you want to delete this course? This action
                      cannot be undone.
                    </p>

                    <div className="flex justify-end gap-4">
                      <button
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteConfirm}
                        className="px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CourseList;
