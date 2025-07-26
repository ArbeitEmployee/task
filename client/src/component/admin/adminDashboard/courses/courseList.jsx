/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  FiEdit,
  FiEdit2,
  FiTrash2,
  FiUser,
  FiSearch,
  FiFilter,
  FiX,
  FiPlus
} from "react-icons/fi";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-hot-toast";

const CourseList = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [editingCourse, setEditingCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCourses, setEditingCourses] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Fetch courses from API
  const [courseData, setCourseData] = useState({
    content: []
  });
  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${base_url}/api/admin/courses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        params: {
          populate: "instructor" // Ensure backend populates instructor data
        }
      });

      // Map courses and ensure instructor data is properly structured
      const coursesWithInstructors = response.data.data.map((course) => ({
        ...course,
        instructor: course.instructor || null // Ensure instructor exists even if null
      }));

      setCourses(coursesWithInstructors);
      setError(null);
    } catch (err) {
      setError("Failed to load courses. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch teachers from API
  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/teachers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      setTeachers(response.data.data);
    } catch (err) {
      toast.error("Error fetching teachers:");
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  // Filter courses based on search and filter
  // Replace your existing filteredCourses with this:
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilterType =
      filterType === "all" || course.type === filterType;

    const matchesFilterCategory =
      filterCategory === "all" ||
      (course.categories || []).includes(filterCategory);

    return matchesSearch && matchesFilterType && matchesFilterCategory;
  });

  const categoryOptions = Array.from(
    new Set(courses.flatMap((c) => c.categories || []))
  );
  // Replace your existing filteredCourses with this:

  // Handle changing course instructor
  const changeInstructor = async (courseId, newInstructorId) => {
    try {
      if (!courseId || !newInstructorId) {
        toast.error("Both course and teacher selection are required.");
        return;
      }

      // Optimistically update the UI
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course._id === courseId
            ? {
                ...course,
                instructor: teachers.find((t) => t._id === newInstructorId)
              }
            : course
        )
      );

      const admindata = JSON.parse(localStorage.getItem("admin"));
      await axios.put(
        `${base_url}/api/admin/courses/${courseId}/change-instructor`,
        {
          newInstructorId,
          changedBy: admindata._id
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      toast.success("Instructor changed successfully!");
      setEditingCourses(null);
    } catch (err) {
      // Revert on error
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course._id === courseId
            ? {
                ...course,
                instructor: teachers.find(
                  (t) => t._id === course.instructor?._id
                )
              }
            : course
        )
      );
      toast.error("Failed to change instructor. Please try again.");
    }
  };

  // Handle deleting a course
  const deleteCourse = async (courseId) => {
    try {
      await axios.delete(`${base_url}/api/admin/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      fetchCourses(); // Refresh the course list after deletion
      toast.success("Course deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete course. Please try again.");
    }
  };

  // Handle starting course edit
  const handleEdit = (course) => {
    setEditingCourse(JSON.parse(JSON.stringify(course))); // Deep copy
    setIsModalOpen(true);
  };
  const handleSave = async (updatedCourse) => {
    try {
      const response = await axios.put(
        `${base_url}/api/admin/update-course/${updatedCourse._id}`,
        {
          title: updatedCourse.title,
          description: updatedCourse.description,
          categories: updatedCourse.categories,
          type: updatedCourse.type,
          price: updatedCourse.type === "premium" ? updatedCourse.price : 0,
          content: updatedCourse.content,
          level: updatedCourse.level || "beginner",
          status: updatedCourse.status || "active"
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          }
        }
      );

      // Update local state
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course._id === updatedCourse._id ? response.data : course
        )
      );

      toast.success("Course updated successfully");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating course:", {
        message: error.message,
        response: error.response?.data,
        request: error.config
      });

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to update course"
      );
    }
  };

  const handleAddContent = async (courseId, newContent) => {
    try {
      const response = await axios.post(
        `${base_url}/api/admin/add-content/${courseId}`,
        newContent,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error adding content:", error);
      throw error;
    }
  };

  const handleUpdateContent = async (courseId, contentId, updatedContent) => {
    try {
      const response = await axios.put(
        `${base_url}/api/admin/update-content/${courseId}/${contentId}`,
        updatedContent,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating content:", error);
      throw error;
    }
  };
  const handleDeleteContent = async (courseId, contentId) => {
    try {
      await axios.delete(
        `${base_url}/api/admin/course/${courseId}/content/${contentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      setCourses((prevCourses) =>
        prevCourses.map((course) => {
          if (course._id === courseId) {
            return {
              ...course,
              content: course.content.filter((item) => item._id !== contentId)
            };
          }
          return course;
        })
      );
    } catch (error) {
      toast.error("Failed to remove content");
      console.error("Delete error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-gray-200 border-t-2 border-t-black rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg">{error}</p>
          <button
            onClick={fetchCourses}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen p-8"
    >
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="w-full mb-6 pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 text-left">
            Course Management
          </h1>
          <p className="text-gray-600 mt-2">
            Streamline course creation and assign qualified instructors to
            ensure high-quality learning.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search courses..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-600" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:border-gray-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Courses</option>
              <option value="free">Free Courses</option>
              <option value="premium">Premium Courses</option>
            </select>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:border-gray-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Course List */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-6"
        >
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                No courses found matching your criteria
              </p>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Course Thumbnail */}
                    <div className="w-full md:w-48 h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={`${base_url}/courses/${course.thumbnail.path}`}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Course Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">
                            {course.title}
                          </h2>
                          <p className="text-gray-600 mt-1">
                            {course.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(course)}
                            className="text-gray-400 hover:text-gray-900 p-2"
                            title="Edit"
                          >
                            <FiEdit2 className="inline-block" />
                          </button>
                          <button
                            onClick={() => deleteCourse(course._id)}
                            className="text-gray-600 hover:text-red-500 p-2"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                          <FiUser className="text-gray-500" />
                          {editingCourses?.instructorEditId === course._id ? (
                            <select
                              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:border-gray-500"
                              value={course.instructor?._id || ""}
                              onChange={(e) =>
                                changeInstructor(course._id, e.target.value)
                              }
                            >
                              <option value="">Select Teacher</option>
                              {teachers.map((teacher) => (
                                <option key={teacher._id} value={teacher._id}>
                                  {teacher.full_name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <>
                              <span className="text-sm text-gray-700 font-medium">
                                {course.instructor
                                  ? typeof course.instructor === "string"
                                    ? teachers.find(
                                        (t) => t._id === course.instructor
                                      )?.full_name || "Invalid instructor"
                                    : course.instructor.full_name
                                  : "No instructor assigned"}
                              </span>
                              <button
                                onClick={() =>
                                  setEditingCourses({
                                    instructorEditId: course._id
                                  })
                                }
                                className="text-gray-500 hover:text-gray-700 text-sm"
                              >
                                <FiEdit2 className="inline-block" />
                              </button>
                            </>
                          )}
                        </div>

                        <div className="text-sm text-gray-500">
                          {course.type === "premium" ? (
                            <span className="font-medium text-green-600">
                              ${course.price}
                            </span>
                          ) : (
                            <span className="font-medium text-blue-600">
                              Free
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-500">
                          {course.studentsEnrolled?.length || 0} students
                        </div>

                        <div className="text-sm text-gray-500">
                          Created:{" "}
                          {new Date(course.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Edit Modal */}
        {isModalOpen && editingCourse && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  Edit Course: {editingCourse.title}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course Title *
                      </label>
                      <input
                        type="text"
                        value={editingCourse.title}
                        onChange={(e) =>
                          setEditingCourse({
                            ...editingCourse,
                            title: e.target.value
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 hover:border-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course Description *
                      </label>
                      <textarea
                        value={editingCourse.description}
                        onChange={(e) =>
                          setEditingCourse({
                            ...editingCourse,
                            description: e.target.value
                          })
                        }
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 hover:border-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course Type *
                      </label>
                      <select
                        value={editingCourse.type}
                        onChange={(e) =>
                          setEditingCourse({
                            ...editingCourse,
                            type: e.target.value
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 hover:border-gray-500"
                      >
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>
                    {editingCourse.type === "premium" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price *
                        </label>
                        <input
                          type="number"
                          value={editingCourse.price}
                          onChange={(e) =>
                            setEditingCourse({
                              ...editingCourse,
                              price: parseFloat(e.target.value)
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 hover:border-gray-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Course Content */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Course Content</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const newContent = {
                                id: Date.now().toString(),
                                type: "tutorial",
                                title: "New Tutorial",
                                description: "",
                                isPremium: editingCourse.type === "premium",
                                ...(editingCourse.type === "free"
                                  ? { youtubeLink: "" }
                                  : { content: "" })
                              };

                              const updatedCourse = await handleAddContent(
                                editingCourse._id,
                                newContent
                              );

                              setEditingCourse(updatedCourse);
                              toast.success("Content added successfully");
                            } catch (error) {
                              toast.error("Failed to add content");
                            }
                          }}
                          className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                        >
                          <FiPlus /> Add Tutorial
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const newContent = {
                                id: Date.now().toString(),
                                type: "quiz",
                                title: "New Quiz",
                                description: "",
                                questions: [
                                  {
                                    id: Date.now().toString(),
                                    question: "",
                                    type: "mcq-single",
                                    options: ["", ""],
                                    correctAnswer: null
                                  }
                                ]
                              };

                              const updatedCourse = await handleAddContent(
                                editingCourse._id,
                                newContent
                              );

                              setEditingCourse(updatedCourse);
                              toast.success("Quiz added successfully");
                            } catch (error) {
                              toast.error("Failed to add quiz");
                            }
                          }}
                          className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                        >
                          <FiPlus /> Add Quiz
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const newContent = {
                                id: Date.now().toString(),
                                type: "live",
                                title: "New Live Class",
                                description: "",
                                meetingLink: "",
                                schedule: new Date().toISOString()
                              };

                              const updatedCourse = await handleAddContent(
                                editingCourse._id,
                                newContent
                              );

                              setEditingCourse(updatedCourse);
                              toast.success("Live class added successfully");
                            } catch (error) {
                              toast.error("Failed to add live class");
                            }
                          }}
                          className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                        >
                          <FiPlus /> Add Live Class
                        </button>
                      </div>
                    </div>

                    {editingCourse.content.map((item, index) => (
                      <div
                        key={item._id || item.id}
                        className="border border-gray-200 rounded-lg p-4 space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">
                            {index + 1}.{" "}
                            {item.type === "tutorial"
                              ? "Tutorial"
                              : item.type === "quiz"
                              ? "Quiz"
                              : "Live Class"}
                          </h4>
                          <button
                            onClick={async () => {
                              try {
                                await handleDeleteContent(
                                  editingCourse._id,
                                  item._id || item.id
                                );
                                const newContent = editingCourse.content.filter(
                                  (c) =>
                                    (c._id || c.id) !== (item._id || item.id)
                                );
                                setEditingCourse({
                                  ...editingCourse,
                                  content: newContent
                                });
                                toast.success("Removed successfully");
                              } catch (error) {
                                toast.error("Failed to remove content");
                              }
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>

                        {item.type === "tutorial" && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title *
                              </label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => {
                                  const newContent = [...editingCourse.content];
                                  newContent[index].title = e.target.value;
                                  setEditingCourse({
                                    ...editingCourse,
                                    content: newContent
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                value={item.description}
                                onChange={(e) => {
                                  const newContent = [...editingCourse.content];
                                  newContent[index].description =
                                    e.target.value;
                                  setEditingCourse({
                                    ...editingCourse,
                                    content: newContent
                                  });
                                }}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            {editingCourse.type === "free" ? (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  YouTube Link *
                                </label>
                                <input
                                  type="url"
                                  value={item.youtubeLink || ""}
                                  onChange={(e) => {
                                    const newContent = [
                                      ...editingCourse.content
                                    ];
                                    newContent[index].youtubeLink =
                                      e.target.value;
                                    setEditingCourse({
                                      ...editingCourse,
                                      content: newContent
                                    });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                            ) : (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Video Content *
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={item.content || ""}
                                    onChange={(e) => {
                                      const newContent = [
                                        ...editingCourse.content
                                      ];
                                      newContent[index].content =
                                        e.target.value;
                                      setEditingCourse({
                                        ...editingCourse,
                                        content: newContent
                                      });
                                    }}
                                    placeholder="Video file path"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                  />
                                  <button className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded">
                                    Upload
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {item.type === "quiz" && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quiz Title *
                              </label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => {
                                  const newContent = [...editingCourse.content];
                                  newContent[index].title = e.target.value;
                                  setEditingCourse({
                                    ...editingCourse,
                                    content: newContent
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                value={item.description}
                                onChange={(e) => {
                                  const newContent = [...editingCourse.content];
                                  newContent[index].description =
                                    e.target.value;
                                  setEditingCourse({
                                    ...editingCourse,
                                    content: newContent
                                  });
                                }}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>

                            <div className="space-y-4">
                              {item.questions?.map((question, qIndex) => (
                                <div
                                  key={question._id || question.id}
                                  className="border-l-2 border-gray-300 pl-3 space-y-3"
                                >
                                  <div className="flex justify-between items-center">
                                    <h5 className="font-medium">
                                      Question {qIndex + 1}
                                    </h5>
                                    <button
                                      onClick={async () => {
                                        try {
                                          const updatedQuestions =
                                            item.questions.filter(
                                              (q) =>
                                                (q._id || q.id) !==
                                                (question._id || question.id)
                                            );

                                          const updatedContent = {
                                            ...item,
                                            questions: updatedQuestions
                                          };

                                          await handleUpdateContent(
                                            editingCourse._id,
                                            item._id || item.id,
                                            updatedContent
                                          );

                                          const newContent = [
                                            ...editingCourse.content
                                          ];
                                          newContent[index].questions =
                                            updatedQuestions;
                                          setEditingCourse({
                                            ...editingCourse,
                                            content: newContent
                                          });

                                          toast.success(
                                            "Question removed successfully"
                                          );
                                        } catch (error) {
                                          toast.error(
                                            "Failed to remove question"
                                          );
                                        }
                                      }}
                                      className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Question Text *
                                    </label>
                                    <input
                                      type="text"
                                      value={question.question}
                                      onChange={(e) => {
                                        const newContent = [
                                          ...editingCourse.content
                                        ];
                                        newContent[index].questions[
                                          qIndex
                                        ].question = e.target.value;
                                        setEditingCourse({
                                          ...editingCourse,
                                          content: newContent
                                        });
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Question Type *
                                    </label>
                                    <select
                                      value={question.type}
                                      onChange={(e) => {
                                        const newContent = [
                                          ...editingCourse.content
                                        ];
                                        newContent[index].questions[
                                          qIndex
                                        ].type = e.target.value;
                                        // Reset correct answer when changing type
                                        newContent[index].questions[
                                          qIndex
                                        ].correctAnswer = null;
                                        setEditingCourse({
                                          ...editingCourse,
                                          content: newContent
                                        });
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                      <option value="mcq-single">
                                        Single Choice MCQ
                                      </option>
                                      <option value="mcq-multiple">
                                        Multiple Choice MCQ
                                      </option>
                                      <option value="short-answer">
                                        Short Answer
                                      </option>
                                      <option value="broad-answer">
                                        Broad Answer
                                      </option>
                                    </select>
                                  </div>

                                  {/* MCQ Question Types */}
                                  {(question.type === "mcq-single" ||
                                    question.type === "mcq-multiple") && (
                                    <div className="space-y-2">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Options *
                                      </label>
                                      {question.options?.map(
                                        (option, oIndex) => (
                                          <div
                                            key={oIndex}
                                            className={`flex items-center gap-2 p-2 rounded-lg ${
                                              (question.type === "mcq-single" &&
                                                question.correctAnswer ===
                                                  oIndex) ||
                                              (question.type ===
                                                "mcq-multiple" &&
                                                Array.isArray(
                                                  question.correctAnswer
                                                ) &&
                                                question.correctAnswer.includes(
                                                  oIndex
                                                ))
                                                ? "border-2 border-green-500 bg-green-50"
                                                : "border border-gray-300"
                                            }`}
                                          >
                                            <input
                                              type={
                                                question.type === "mcq-single"
                                                  ? "radio"
                                                  : "checkbox"
                                              }
                                              name={`question-${qIndex}`}
                                              checked={
                                                question.type === "mcq-single"
                                                  ? question.correctAnswer ===
                                                    oIndex
                                                  : Array.isArray(
                                                      question.correctAnswer
                                                    ) &&
                                                    question.correctAnswer.includes(
                                                      oIndex
                                                    )
                                              }
                                              onChange={() => {
                                                const newContent = [
                                                  ...editingCourse.content
                                                ];
                                                if (
                                                  question.type === "mcq-single"
                                                ) {
                                                  newContent[index].questions[
                                                    qIndex
                                                  ].correctAnswer = oIndex;
                                                } else {
                                                  const currentAnswers =
                                                    newContent[index].questions[
                                                      qIndex
                                                    ].correctAnswer || [];
                                                  newContent[index].questions[
                                                    qIndex
                                                  ].correctAnswer =
                                                    currentAnswers.includes(
                                                      oIndex
                                                    )
                                                      ? currentAnswers.filter(
                                                          (a) => a !== oIndex
                                                        )
                                                      : [
                                                          ...currentAnswers,
                                                          oIndex
                                                        ];
                                                }
                                                setEditingCourse({
                                                  ...editingCourse,
                                                  content: newContent
                                                });
                                              }}
                                              className={`h-4 w-4 ${
                                                question.type === "mcq-single"
                                                  ? "text-green-600"
                                                  : "text-green-600"
                                              } border-gray-300 focus:ring-green-500`}
                                            />
                                            <input
                                              type="text"
                                              value={option}
                                              onChange={(e) => {
                                                const newContent = [
                                                  ...editingCourse.content
                                                ];
                                                newContent[index].questions[
                                                  qIndex
                                                ].options[oIndex] =
                                                  e.target.value;
                                                setEditingCourse({
                                                  ...editingCourse,
                                                  content: newContent
                                                });
                                              }}
                                              className="flex-1 px-3 py-1 border-none focus:ring-0 bg-transparent"
                                              placeholder={`Option ${
                                                oIndex + 1
                                              }`}
                                            />
                                            {question.options.length > 2 && (
                                              <button
                                                onClick={async () => {
                                                  try {
                                                    const newOptions =
                                                      item.questions[
                                                        qIndex
                                                      ].options.filter(
                                                        (_, i) => i !== oIndex
                                                      );

                                                    const updatedQuestions = [
                                                      ...item.questions
                                                    ];
                                                    updatedQuestions[
                                                      qIndex
                                                    ].options = newOptions;

                                                    if (
                                                      question.type ===
                                                      "mcq-single"
                                                    ) {
                                                      if (
                                                        updatedQuestions[qIndex]
                                                          .correctAnswer ===
                                                        oIndex
                                                      ) {
                                                        updatedQuestions[
                                                          qIndex
                                                        ].correctAnswer = null;
                                                      } else if (
                                                        updatedQuestions[qIndex]
                                                          .correctAnswer >
                                                        oIndex
                                                      ) {
                                                        updatedQuestions[
                                                          qIndex
                                                        ].correctAnswer -= 1;
                                                      }
                                                    } else {
                                                      updatedQuestions[
                                                        qIndex
                                                      ].correctAnswer =
                                                        updatedQuestions[
                                                          qIndex
                                                        ].correctAnswer
                                                          ?.filter(
                                                            (a) => a !== oIndex
                                                          )
                                                          ?.map((a) =>
                                                            a > oIndex
                                                              ? a - 1
                                                              : a
                                                          ) || [];
                                                    }

                                                    const updatedContent = {
                                                      ...item,
                                                      questions:
                                                        updatedQuestions
                                                    };

                                                    await handleUpdateContent(
                                                      editingCourse._id,
                                                      item._id || item.id,
                                                      updatedContent
                                                    );

                                                    const newContent = [
                                                      ...editingCourse.content
                                                    ];
                                                    newContent[
                                                      index
                                                    ].questions =
                                                      updatedQuestions;
                                                    setEditingCourse({
                                                      ...editingCourse,
                                                      content: newContent
                                                    });

                                                    toast.success(
                                                      "Option removed successfully"
                                                    );
                                                  } catch (error) {
                                                    toast.error(
                                                      "Failed to remove option"
                                                    );
                                                  }
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                              >
                                                Remove
                                              </button>
                                            )}
                                          </div>
                                        )
                                      )}
                                      <button
                                        onClick={async () => {
                                          try {
                                            const newOptions = [
                                              ...item.questions[qIndex].options,
                                              ""
                                            ];

                                            const updatedQuestions = [
                                              ...item.questions
                                            ];
                                            updatedQuestions[qIndex].options =
                                              newOptions;

                                            const updatedContent = {
                                              ...item,
                                              questions: updatedQuestions
                                            };

                                            await handleUpdateContent(
                                              editingCourse._id,
                                              item._id || item.id,
                                              updatedContent
                                            );

                                            const newContent = [
                                              ...editingCourse.content
                                            ];
                                            newContent[index].questions =
                                              updatedQuestions;
                                            setEditingCourse({
                                              ...editingCourse,
                                              content: newContent
                                            });

                                            toast.success(
                                              "Option added successfully"
                                            );
                                          } catch (error) {
                                            toast.error("Failed to add option");
                                          }
                                        }}
                                        className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
                                      >
                                        <FiPlus className="h-4 w-4" /> Add
                                        Option
                                      </button>
                                    </div>
                                  )}

                                  {/* Short Answer Question Type */}
                                  {question.type === "short-answer" && (
                                    <div className="space-y-2">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Expected Answer (for reference)
                                      </label>
                                      <input
                                        type="text"
                                        value={question.correctAnswer || ""}
                                        onChange={(e) => {
                                          const newContent = [
                                            ...editingCourse.content
                                          ];
                                          newContent[index].questions[
                                            qIndex
                                          ].correctAnswer = e.target.value;
                                          setEditingCourse({
                                            ...editingCourse,
                                            content: newContent
                                          });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="Expected short answer"
                                      />
                                    </div>
                                  )}

                                  {/* Broad Answer Question Type */}
                                  {question.type === "broad-answer" && (
                                    <div className="space-y-2">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Answer Guidelines
                                      </label>
                                      <textarea
                                        value={question.correctAnswer || ""}
                                        onChange={(e) => {
                                          const newContent = [
                                            ...editingCourse.content
                                          ];
                                          newContent[index].questions[
                                            qIndex
                                          ].correctAnswer = e.target.value;
                                          setEditingCourse({
                                            ...editingCourse,
                                            content: newContent
                                          });
                                        }}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="Provide guidelines for evaluating broad answers"
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}

                              <button
                                onClick={async () => {
                                  try {
                                    const newQuestion = {
                                      id: Date.now().toString(),
                                      question: "New Question",
                                      type: "mcq-single",
                                      options: ["Option 1", "Option 2"],
                                      correctAnswer: null
                                    };

                                    const updatedQuestions = [
                                      ...item.questions,
                                      newQuestion
                                    ];

                                    const updatedContent = {
                                      ...item,
                                      questions: updatedQuestions
                                    };

                                    await handleUpdateContent(
                                      editingCourse._id,
                                      item._id || item.id,
                                      updatedContent
                                    );

                                    const newContent = [
                                      ...editingCourse.content
                                    ];
                                    newContent[index].questions =
                                      updatedQuestions;
                                    setEditingCourse({
                                      ...editingCourse,
                                      content: newContent
                                    });

                                    toast.success(
                                      "Question added successfully"
                                    );
                                  } catch (error) {
                                    toast.error("Failed to add question");
                                  }
                                }}
                                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                              >
                                + Add Question
                              </button>
                            </div>
                          </div>
                        )}

                        {item.type === "live" && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title *
                              </label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => {
                                  const newContent = [...editingCourse.content];
                                  newContent[index].title = e.target.value;
                                  setEditingCourse({
                                    ...editingCourse,
                                    content: newContent
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                value={item.description}
                                onChange={(e) => {
                                  const newContent = [...editingCourse.content];
                                  newContent[index].description =
                                    e.target.value;
                                  setEditingCourse({
                                    ...editingCourse,
                                    content: newContent
                                  });
                                }}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Meeting Link *
                              </label>
                              <input
                                type="url"
                                value={item.meetingLink || ""}
                                onChange={(e) => {
                                  const newContent = [...editingCourse.content];
                                  newContent[index].meetingLink =
                                    e.target.value;
                                  setEditingCourse({
                                    ...editingCourse,
                                    content: newContent
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Schedule *
                              </label>
                              <input
                                type="datetime-local"
                                value={item.schedule || ""}
                                onChange={(e) => {
                                  const newContent = [...editingCourse.content];
                                  newContent[index].schedule = e.target.value;
                                  setEditingCourse({
                                    ...editingCourse,
                                    content: newContent
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave(editingCourse)}
                    className="px-6 py-2 rounded-lg font-medium text-white bg-gray-600 hover:bg-gray-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CourseList;
