/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiAward,
  FiX,
  FiPlay,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import ProgressBar from "@ramonak/react-progress-bar";

const ProgressStats = ({ course }) => {
  return (
    <div className="space-y-2 mb-4">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Overall Progress</span>
        <span className="font-medium">{course.progress}%</span>
      </div>
      <ProgressBar
        completed={course.progress}
        height="8px"
        bgColor={course.completed ? "#10B981" : "#6366F1"}
        baseBgColor="#E5E7EB"
        isLabelVisible={false}
      />

      {course.stats.totalQuestions > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 text-xs mt-3">
            <div className="bg-green-50 p-2 rounded text-center">
              <div className="font-bold text-green-700">
                {course.stats.correctAnswers}
              </div>
              <div className="text-green-600">Correct</div>
            </div>
            <div className="bg-red-50 p-2 rounded text-center">
              <div className="font-bold text-red-700">
                {course.stats.incorrectAnswers}
              </div>
              <div className="text-red-600">Incorrect</div>
            </div>
            <div className="bg-blue-50 p-2 rounded text-center">
              <div className="font-bold text-blue-700">
                {course.stats.accuracy}%
              </div>
              <div className="text-blue-600">Accuracy</div>
            </div>
          </div>

          <div className="flex justify-between text-xs mt-2">
            <span className="text-gray-500">Score:</span>
            <span className="font-medium">
              {course.stats.totalMarksObtained} / {course.stats.totalMaxMarks}
              <span className="ml-1">({course.stats.overallPercentage}%)</span>
            </span>
          </div>
        </>
      )}

      <div className="text-xs text-gray-500 mt-1">
        {course.completedItems} of {course.totalItems} lessons completed
      </div>
    </div>
  );
};

const MyCourses = ({ setActiveView }) => {
  const navigate = useNavigate();
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const studentData = JSON.parse(localStorage.getItem("studentData"));
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const fetchUserCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${base_url}/api/student/enrolled-courses/${studentData.id}`,
        getAuthHeaders()
      );

      const formattedCourses = response.data.enrolledCourses.map((item) => {
        const course = item.courseDetails || {};
        const enrollment = item.enrollmentInfo || {};

        // Handle thumbnail path
        let thumbnailPath = "/default-thumbnail.jpg";
        if (course.thumbnail?.path) {
          thumbnailPath = course.thumbnail.path.replace(/\\/g, "/");
          if (thumbnailPath.startsWith("public/")) {
            thumbnailPath = thumbnailPath.substring(7);
          }
        }

        // Calculate progress
        let progress = enrollment.progress || 0;
        let completedItems = 0;
        let totalItems = course.totalContentItems || 0;
        let isCompleted = enrollment.completed || false;

        if (
          enrollment.progressDetails &&
          Array.isArray(enrollment.progressDetails)
        ) {
          completedItems = enrollment.progressDetails.filter(
            (item) => item.completed
          ).length;
          if (totalItems > 0) {
            progress = Math.round((completedItems / totalItems) * 100);
          }
          isCompleted = isCompleted || progress === 100;
        }

        // Extract categories
        const courseCategories = course.category ? [course.category] : [];

        return {
          id: course._id,
          title: course.title,
          description: course.description,
          thumbnail: thumbnailPath,
          instructor: course.instructor,
          duration: course.duration
            ? `${Math.floor(course.duration / 60)}h ${course.duration % 60}m`
            : "N/A",
          price: course.price || 0,
          progress: progress,
          lastAccessed: enrollment.lastAccessed,
          completed: isCompleted,
          enrolledAt: enrollment.enrolledAt
            ? new Date(enrollment.enrolledAt).toLocaleDateString()
            : "Unknown date",
          categories: courseCategories,
          totalItems,
          completedItems,
          lastActivity: enrollment.lastAccessed
            ? `Last active: ${new Date(
                enrollment.lastAccessed
              ).toLocaleDateString()}`
            : "Not started yet",
          certificate: enrollment.certificate,
          stats: enrollment.stats || {
            totalQuestions: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            accuracy: 0,
            totalMarksObtained: 0,
            totalMaxMarks: 0,
            overallPercentage: 0
          }
        };
      });

      // Extract all unique categories for filtering
      const allCategories = new Set();
      formattedCourses.forEach((course) => {
        course.categories.forEach((cat) => {
          if (typeof cat === "object") {
            allCategories.add(cat.name);
          } else {
            allCategories.add(cat);
          }
        });
      });
      setCategories(Array.from(allCategories));

      setMyCourses(formattedCourses);
    } catch (error) {
      toast.error("Failed to load courses");
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserCourses();
  }, []);

  const recordCourseAccess = async (courseId) => {
    try {
      await axios.post(
        `${base_url}/api/student/${courseId}/access`,
        {},
        getAuthHeaders()
      );
      setMyCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.id === courseId
            ? {
                ...course,
                lastAccessed: new Date().toISOString(),
                lastActivity: `Last active: ${new Date().toLocaleDateString()}`
              }
            : course
        )
      );
    } catch (error) {
      console.error("Error recording course access:", error);
    }
  };

  const handleStartCourse = async (courseId) => {
    await recordCourseAccess(courseId);
    navigate(`/student/learn/${courseId}`);
  };

  const handleViewCertificate = async (courseId) => {
    try {
      // Check if student has completed the course
      const course = myCourses.find((c) => c.id === courseId);
      if (!course) {
        toast.error("Course not found");
        return;
      }

      if (!course.completed) {
        toast.error("Please complete the course to get your certificate");
        return;
      }

      // Show loading
      toast.loading("Generating your certificate...");

      // Generate/download certificate
      const response = await axios.get(
        `${base_url}/api/student/certificate/${courseId}/${studentData.id}`,
        {
          ...getAuthHeaders(),
          responseType: "blob" // Important for file downloads
        }
      );

      // Create blob URL for the PDF
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${course.title.replace(
          /\s+/g,
          "_"
        )}_Certificate_${studentData.full_name.replace(/\s+/g, "_")}.pdf`
      );
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("Certificate downloaded successfully");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to download certificate");
      console.error("Certificate download error:", error);
    }
  };

  const removeCourse = async (courseId) => {
    try {
      await axios.delete(
        `${base_url}/api/student/enrolled-courses/${studentData.id}/${courseId}`,
        getAuthHeaders()
      );
      setMyCourses(myCourses.filter((course) => course.id !== courseId));
      toast.success("Course removed successfully");
    } catch (error) {
      toast.error("Failed to remove course");
      console.error("Error removing course:", error);
    }
  };

  const getInstructorName = (instructor) => {
    if (typeof instructor === "object" && instructor !== null) {
      return instructor.full_name || instructor.name || "Unknown Instructor";
    }
    return "Unknown Instructor";
  };

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const sortCourses = (courses) => {
    switch (sortOption) {
      case "recent":
        return [...courses].sort(
          (a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt)
        );
      case "progress":
        return [...courses].sort((a, b) => b.progress - a.progress);
      case "title":
        return [...courses].sort((a, b) => a.title.localeCompare(b.title));
      case "duration":
        return [...courses].sort((a, b) => {
          const aDuration = parseInt(a.duration) || 0;
          const bDuration = parseInt(b.duration) || 0;
          return bDuration - aDuration;
        });
      case "performance":
        return [...courses].sort((a, b) => b.stats.accuracy - a.stats.accuracy);
      default:
        return courses;
    }
  };

  const filteredCourses = () => {
    let result = myCourses;

    // Filter by tab
    if (activeTab !== "all") {
      result = result.filter((course) =>
        activeTab === "free" ? course.price === 0 : course.price > 0
      );
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query) ||
          getInstructorName(course.instructor).toLowerCase().includes(query)
      );
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      result = result.filter((course) =>
        course.categories.some((cat) => {
          const catName = typeof cat === "object" ? cat.name : cat;
          return selectedCategories.includes(catName);
        })
      );
    }

    // Sort
    return sortCourses(result);
  };

  return (
    <div className="min-h-screen text-gray-900 bg-gray-50">
      {/* Header */}
      <header className="bg-white py-6 px-4 sm:px-6 lg:px-8 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                My Learning Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Track your learning progress and achievements
              </p>
            </div>
            <button
              onClick={() => setActiveView("courseList")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center w-full md:w-auto"
            >
              <FiBookOpen className="mr-2" />
              Browse More Courses
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-3">
                <FiBookOpen size={20} />
              </div>
              <div>
                <div className="text-gray-500 text-sm">Total Courses</div>
                <div className="text-2xl font-bold text-gray-800">
                  {myCourses.length}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-3">
                <FiCheckCircle size={20} />
              </div>
              <div>
                <div className="text-gray-500 text-sm">Completed</div>
                <div className="text-2xl font-bold text-gray-800">
                  {myCourses.filter((c) => c.completed).length}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-3">
                <FiClock size={20} />
              </div>
              <div>
                <div className="text-gray-500 text-sm">In Progress</div>
                <div className="text-2xl font-bold text-gray-800">
                  {
                    myCourses.filter((c) => c.progress > 0 && !c.completed)
                      .length
                  }
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-3">
                <FiAward size={20} />
              </div>
              <div>
                <div className="text-gray-500 text-sm">Certificates</div>
                <div className="text-2xl font-bold text-gray-800">
                  {myCourses.filter((c) => c.certificate).length}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search courses..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiFilter className="mr-2" />
                Filters
                {showFilters ? (
                  <FiChevronUp className="ml-2" />
                ) : (
                  <FiChevronDown className="ml-2" />
                )}
              </button>

              <select
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="recent">Recently Enrolled</option>
                <option value="progress">Progress</option>
                <option value="performance">Performance</option>
                <option value="title">Course Title</option>
                <option value="duration">Course Duration</option>
              </select>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1 text-xs rounded-full ${
                      selectedCategories.includes(category)
                        ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                        : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setSearchQuery("");
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Clear all filters
                </button>

                <div className="text-sm text-gray-500">
                  {filteredCourses().length} courses found
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center ${
              activeTab === "all"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("all")}
          >
            All Courses
            <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {myCourses.length}
            </span>
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center ${
              activeTab === "free"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("free")}
          >
            Free Courses
            <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {myCourses.filter((c) => c.price === 0).length}
            </span>
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center ${
              activeTab === "premium"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("premium")}
          >
            Premium Courses
            <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {myCourses.filter((c) => c.price > 0).length}
            </span>
          </button>
        </div>

        {/* Courses List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-gray-200 w-full"></div>
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses().length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses().map((course) => (
              <motion.div
                key={course.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -5 }}
              >
                <div className="relative">
                  <img
                    src={`${base_url}/${course.thumbnail}`}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = `${base_url}/default-thumbnail.jpg`;
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 text-xs rounded-full">
                    {course.price === 0 ? "FREE" : `$${course.price}`}
                  </div>
                  {course.completed && (
                    <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 text-xs rounded-full flex items-center">
                      <FiCheckCircle className="mr-1" /> Completed
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                      {course.title}
                    </h3>
                    <button
                      onClick={() => removeCourse(course.id)}
                      className="text-gray-400 hover:text-red-500 p-1 -mt-1 -mr-1"
                      aria-label="Remove course"
                    >
                      <FiX size={18} />
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mb-2">
                    Instructor: {getInstructorName(course.instructor)}
                  </p>

                  <div
                    className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: course.description }}
                  />

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {course.duration}
                    </span>
                    {course.categories.slice(0, 2).map((category, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                      >
                        {typeof category === "object"
                          ? category.name
                          : category}
                      </span>
                    ))}
                    {course.categories.length > 2 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        +{course.categories.length - 2} more
                      </span>
                    )}
                  </div>

                  <ProgressStats course={course} />

                  <div className="flex justify-between items-center mt-auto">
                    <div className="text-xs text-gray-500">
                      Enrolled: {course.enrolledAt}
                    </div>
                    <button
                      onClick={() =>
                        course.completed
                          ? handleViewCertificate(course.id)
                          : handleStartCourse(course.id)
                      }
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        course.completed
                          ? "bg-green-100 text-green-700 hover:bg-green-200 flex items-center"
                          : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 flex items-center"
                      } transition-colors`}
                    >
                      {course.completed ? (
                        <>
                          <FiAward className="mr-1" />
                          Certificate
                        </>
                      ) : (
                        <>
                          <FiPlay className="mr-1" />
                          {course.progress === 0 ? "Start" : "Continue"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <FiBookOpen className="text-gray-400 text-4xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {activeTab === "all"
                ? "You haven't enrolled in any courses yet"
                : activeTab === "free"
                ? "No free courses enrolled"
                : "No premium courses enrolled"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {activeTab === "all"
                ? "Browse our courses and start learning today!"
                : activeTab === "free"
                ? "Explore our free courses to start learning without any cost."
                : "Check out our premium courses for advanced learning experiences."}
            </p>
            <button
              onClick={() => setActiveView("courseList")}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all"
            >
              Browse Courses
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default MyCourses;
