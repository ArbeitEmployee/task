/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiBookOpen,
  FiDollarSign,
  FiYoutube,
  FiShoppingCart,
  FiCheck,
  FiStar,
  FiFilter,
  FiSearch,
  FiClock,
  FiUsers,
  FiEye
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

const CourseList = ({ setActiveView }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [enrolling, setEnrolling] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const studentData = JSON.parse(localStorage.getItem("studentData"));
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [categories, setCategories] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Fetch courses, enrolled courses, and cart
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let teachersList = [];
      try {
        const teachersResponse = await axios.get(
          `${base_url}/api/student/teachers`
        );
        if (teachersResponse.data?.success) {
          teachersList = teachersResponse.data.teachers || [];
        }

        // Fetch all courses
        const coursesResponse = await axios.get(
          `${base_url}/api/student/all-courses`
        );
        const categoriesResponse = await axios.get(
          `${base_url}/api/auth/categories`
        );

        if (coursesResponse.data.success) {
          const formattedCourses = coursesResponse.data.courses.map(
            (course) => {
              const instructor = teachersList.find((teacher) => {
                const teacherIdStr = teacher._id.toString();
                const courseInstructorStr = course.instructor?.toString();
                return teacherIdStr === courseInstructorStr;
              });

              return {
                id: course._id,
                title: course.title || "Untitled Course",
                description: course.description || "No description available",
                thumbnail: course.thumbnail?.filename
                  ? `${base_url}/courses/${course.thumbnail.path}`
                  : course.thumbnail ||
                    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
                instructor: instructor
                  ? instructor.full_name
                  : "Unknown Instructor",
                rating: course.averageRating || 0,
                students: course.totalStudents || 0,
                price: course.price || 0,
                type: course.price > 0 ? "premium" : "free",
                categories:
                  course.categories?.map((cat) =>
                    typeof cat === "object" ? cat.name : cat
                  ) || [],
                level: course.level || "beginner"
              };
            }
          );

          setCourses(formattedCourses);
          setFilteredCourses(formattedCourses);
        }

        if (categoriesResponse.data.success) {
          setCategories(categoriesResponse.data.categories);
        }

        // Fetch enrolled courses if student is logged in
        const isAuthenticated =
          studentData?.id && localStorage.getItem("studentToken");

        if (isAuthenticated) {
          try {
            // Fetch enrolled courses
            const enrolledResponse = await axios.get(
              `${base_url}/api/student/enrolled-courses/${studentData.id}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                    "studentToken"
                  )}`
                }
              }
            );

            if (enrolledResponse.data.success) {
              const enrolledIds = enrolledResponse.data.enrolledCourses
                .map((ec) => ec?.courseDetails?._id)
                .filter(Boolean); // Filter out invalid IDs
              setEnrolledCourses(enrolledIds);
            }
          } catch (enrolledError) {
            console.error("Error fetching enrolled courses:", enrolledError);
            toast.error("Failed to load enrolled courses");
          }

          // Fetch cart from server
          await fetchCart();
        } else {
          // Load cart from localStorage for guest users
          try {
            const savedCart =
              JSON.parse(localStorage.getItem("courseCart")) || [];
            // Validate cart items
            const validCart = savedCart.filter(
              (item) => item?.id && item?.title && !isNaN(item?.price)
            );
            setCart(validCart);
            // Update localStorage with cleaned cart
            if (validCart.length !== savedCart.length) {
              localStorage.setItem("courseCart", JSON.stringify(validCart));
            }
          } catch (localStorageError) {
            console.error(
              "Error loading cart from localStorage:",
              localStorageError
            );
            localStorage.removeItem("courseCart");
            setCart([]);
          }
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        toast.error(error.response?.data?.message || "Failed to load data");

        // Reset to empty states if critical error occurs
        if (error.response?.status === 401) {
          // Handle unauthorized (logged out) state
          setEnrolledCourses([]);
          setCart([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let results = courses;

    if (searchTerm) {
      results = results.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (course.instructor &&
            course.instructor
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (course.description &&
            course.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (priceFilter === "free") {
      results = results.filter((course) => course.price === 0);
    } else if (priceFilter === "paid") {
      results = results.filter((course) => course.price > 0);
    }

    if (filterType !== "all") {
      results = results.filter((course) => course.type === filterType);
    }

    if (filterCategory !== "all") {
      results = results.filter((course) =>
        course.categories?.some(
          (cat) => cat.toLowerCase() === filterCategory.toLowerCase()
        )
      );
    }

    if (filterLevel !== "all") {
      results = results.filter(
        (course) => course.level?.toLowerCase() === filterLevel.toLowerCase()
      );
    }

    setFilteredCourses(results);
  }, [
    searchTerm,
    priceFilter,
    courses,
    filterType,
    filterCategory,
    filterLevel
  ]);

  const categoryOptions = Array.from(
    new Set(courses.flatMap((c) => c.categories || []).filter(Boolean))
  );

  const fetchCart = async () => {
    try {
      setCartLoading(true);
      const response = await axios.get(`${base_url}/api/student/cart`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("studentToken")}`
        }
      });

      if (response.data.success) {
        const serverCart = response.data.cart.items
          .map((item) => ({
            id: item.courseId?._id,
            title: item.courseId?.title,
            thumbnail: item.courseId?.thumbnail,
            price: item.price,
            addedAt: item.addedAt
          }))
          .filter((item) => item.id && item.title); // Filter out invalid items

        setCart(serverCart);
        localStorage.setItem("courseCart", JSON.stringify(serverCart));
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setCartLoading(false);
    }
  };

  const addToCart = async (course) => {
    if (!course?.id || !course?.title) {
      console.error("Invalid course data");
      return;
    }

    if (isEnrolled(course.id)) {
      toast.error("You are already enrolled in this course");
      return;
    }

    if (isInCart(course.id)) {
      toast.error("Course already in cart");
      return;
    }

    try {
      setCartLoading(true);

      if (studentData?.id && localStorage.getItem("studentToken")) {
        const response = await axios.post(
          `${base_url}/api/student/cart`,
          { courseId: course.id },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("studentToken")}`
            }
          }
        );

        if (response.data.success) {
          const newCartItem = {
            id: course.id,
            title: course.title,
            thumbnail: course.thumbnail,
            price: course.price,
            instructor: course.instructor,
            addedAt: new Date().toISOString()
          };

          setCart((prevCart) => [...prevCart, newCartItem]);
          toast.success("Course added to cart");
        }
      } else {
        const newCartItem = {
          id: course.id,
          title: course.title,
          thumbnail: course.thumbnail,
          price: course.price,
          instructor: course.instructor,
          addedAt: new Date().toISOString()
        };

        setCart((prevCart) => [...prevCart, newCartItem]);
        localStorage.setItem(
          "courseCart",
          JSON.stringify([...cart, newCartItem])
        );
        toast.success("Course added to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setCartLoading(false);
    }
  };
  const removeFromCart = async (courseId) => {
    try {
      if (studentData?.id && localStorage.getItem("studentToken")) {
        await axios.delete(`${base_url}/api/student/cart/${courseId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("studentToken")}`
          }
        });
      }

      const updatedCart = cart.filter((item) => item.id !== courseId);
      setCart(updatedCart);
      localStorage.setItem("courseCart", JSON.stringify(updatedCart));
      toast.success("Course removed from cart");
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error(
        error.response?.data?.message || "Failed to remove from cart"
      );
    }
  };
  // Add this useEffect hook near your other effects
  useEffect(() => {
    // Clean up any invalid items on component mount
    const cleanCart = cart.filter((item) => item?.id && item?.title);
    if (cleanCart.length !== cart.length) {
      setCart(cleanCart);
      localStorage.setItem("courseCart", JSON.stringify(cleanCart));
    }
  }, []);
  const isInCart = (courseId) => cart.some((item) => item.id === courseId);
  const isEnrolled = (courseId) => {
    return enrolledCourses.some((id) => id.toString() === courseId.toString());
  };

  return (
    <div className="min-h-screen bg-white text-black p-0">
      {/* Header */}
      <header className="bg-white py-4 px-4 sm:px-6 lg:px-8 border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">Courses</h1>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => setActiveView("myCourses")}
              className="relative p-1 sm:p-2 rounded-full hover:bg-gray-100"
              aria-label="My Courses"
            >
              <FiBookOpen className="text-lg sm:text-xl" />
              {enrolledCourses.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {enrolledCourses.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView("cart")}
              className="relative p-1 sm:p-2 rounded-full hover:bg-gray-100"
              aria-label="Shopping Cart"
            >
              <FiShoppingCart className="text-lg sm:text-xl" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto py-6">
        {/* Search and Filter Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
            <div className="relative flex-1 max-w-6xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search courses..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:border-black hover:border-black text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center">
                <FiFilter className="text-gray-500 mr-1 sm:mr-2 text-sm sm:text-base" />
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 focus:border-black hover:border-black text-sm sm:text-base"
                >
                  <option value="all">All Courses</option>
                  <option value="free">Free Courses</option>
                  <option value="paid">Premium Courses</option>
                </select>
              </div>

              <div className="relative group">
                <select
                  className="block appearance-none w-full bg-white border border-gray-300 hover:border-black px-4 py-2 pr-8 rounded-lg shadow-sm focus:outline-none focus:border-black cursor-pointer"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all" className="text-gray-400 italic">
                    All Categories
                  </option>
                  {categoryOptions.map((cat) => (
                    <option
                      key={cat}
                      value={cat.toLowerCase()}
                      className="checked:bg-gray-100 hover:bg-gray-100"
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div className="relative group">
                <select
                  className="block appearance-none w-full bg-white border border-gray-300 hover:border-black px-2 sm:px-3 py-1 sm:py-2 pr-8 rounded-lg shadow-sm focus:outline-none focus:border-black cursor-pointer text-sm sm:text-base"
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredCourses.map((course) => (
              <motion.div
                key={course.id}
                className="bg-white rounded-xl shadow-md border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-all overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -5 }}
              >
                <div>
                  <div className="relative">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80";
                      }}
                    />
                    <div className="absolute top-3 right-3 bg-black text-white px-3 py-1 text-xs font-medium rounded-full">
                      {course.price === 0 ? "FREE" : `৳${course.price}`}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold line-clamp-2">
                        {course.title}
                      </h3>
                    </div>
                    <p
                      className="text-sm text-gray-600 mb-3 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: course.description }}
                    />
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
                      <span className="flex items-center">
                        <FiStar className="mr-1 text-yellow-400" />{" "}
                        {course.rating > 0
                          ? course.rating.toFixed(1)
                          : "No ratings"}
                      </span>
                      <span className="flex items-center">
                        <FiUsers className="mr-1" />{" "}
                        {course.students.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700 mb-3">
                      By {course.instructor}
                    </span>
                  </div>
                </div>

                <div className="px-4 pb-4 flex flex-col gap-2">
                  <button
                    onClick={() =>
                      navigate(`/student/course-overview/${course.id}`)
                    }
                    className="w-full bg-white text-black border border-black py-2 rounded-lg text-sm hover:bg-gray-50 transition-all flex items-center justify-center"
                  >
                    <FiEye className="mr-2" /> Overview
                  </button>

                  {isEnrolled(course.id) ? (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full bg-green-50 text-green-700 py-2 rounded-lg text-sm text-center flex items-center justify-center"
                    >
                      <FiCheck className="mr-2" /> Enrolled
                    </motion.span>
                  ) : isInCart(course.id) ? (
                    <button
                      onClick={() => removeFromCart(course.id)}
                      className="w-full bg-white text-red-600 border border-red-600 py-2 rounded-lg text-sm hover:bg-red-50 flex items-center justify-center"
                    >
                      <FiShoppingCart className="mr-2" /> Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => addToCart(course)}
                      className="w-full bg-black text-white py-2 rounded-lg text-sm hover:bg-gray-800 flex items-center justify-center"
                      disabled={isEnrolled(course.id)}
                    >
                      <FiShoppingCart className="mr-2" />
                      {isEnrolled(course.id)
                        ? "Already Enrolled"
                        : "Add to Cart"}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FiBookOpen className="text-gray-400 text-3xl" />
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-black mb-2">
              No courses found
            </h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">
              Try adjusting your search or filter to find what you're looking
              for.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseList;
