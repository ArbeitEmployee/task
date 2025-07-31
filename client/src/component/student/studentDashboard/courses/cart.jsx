/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShoppingCart,
  FiX,
  FiArrowLeft,
  FiCreditCard,
  FiStar,
  FiCheckCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";
import Checkout from "./Checkout";

const Cart = ({ setActiveView }) => {
  const [cart, setCart] = useState([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const studentData = JSON.parse(localStorage.getItem("studentData"));
  const [hasFreeCourses, setHasFreeCourses] = useState(false);
  const [hasPremiumCourses, setHasPremiumCourses] = useState(false);
  // Load cart from API
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await axios.get(`${base_url}/api/student/cart`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("studentToken")}`,
          },
        });

        if (response.data.success) {
          // Transform the API response to match the expected format
          const formattedCart = response.data.cart.items.map((item) => ({
            id: item.courseId._id,
            title: item.courseId.title,
            thumbnail: item.courseId.thumbnail,
            price: item.price,
            instructor: item.courseId.instructor,
            rating: 4.5, // Default value since not in API
            students: 100, // Default value since not in API
          }));

          setCart(formattedCart);
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
        toast.error("Failed to load cart");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remove item from cart
  const removeFromCart = async (courseId) => {
    try {
      await axios.delete(`${base_url}/api/student/cart/${courseId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("studentToken")}`,
        },
      });

      // Update local state
      setCart((prevCart) => prevCart.filter((item) => item.id !== courseId));
      toast.success("Course removed from cart");
    } catch (error) {
      console.error("Error removing item from cart:", error);
      toast.error("Failed to remove course");
    }
  };
  useEffect(() => {
    const free = cart.some((item) => item.price === 0);
    const premium = cart.some((item) => item.price > 0);
    setHasFreeCourses(free);
    setHasPremiumCourses(premium);
  }, [cart]);
  const handleEnrollFreeCourses = async () => {
    try {
      setLoading(true);

      // Filter only free courses
      const freeCourseIds = cart
        .filter((item) => item.price === 0)
        .map((item) => item.id);

      // Call enroll API for each free course
      await Promise.all(
        freeCourseIds.map(async (courseId) => {
          await axios.post(
            `${base_url}/api/student/${courseId}/enroll`,
            { user_id: studentData.id },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("studentToken")}`,
              },
            }
          );
        })
      );

      // Remove enrolled courses from cart
      const updatedCart = cart.filter((item) => item.price > 0);
      setCart(updatedCart);

      if (studentData?.id && localStorage.getItem("studentToken")) {
        // Update server cart
        await axios.delete(`${base_url}/api/student/cart/free-courses`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("studentToken")}`,
          },
        });
      } else {
        // Update local storage for guest
        localStorage.setItem("courseCart", JSON.stringify(updatedCart));
      }

      toast.success("Successfully enrolled in free courses!");
      setActiveView("myCourses");
    } catch (error) {
      console.error("Enrollment error:", error);
      toast.error(
        error.response?.data?.message || "Failed to enroll in courses"
      );
    } finally {
      setLoading(false);
    }
  };
  // Calculate total
  const total = cart.reduce((sum, item) => sum + (item.price || 0), 0);

  const openCheckoutModal = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setShowCheckoutModal(true);
  };

  const closeCheckoutModal = () => {
    setShowCheckoutModal(false);
  };

  // Handle successful checkout
  const handleCheckoutSuccess = async () => {
    try {
      // Call the checkout API
      const response = await axios.post(
        `${base_url}/api/student/cart/checkout`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("studentToken")}`,
          },
        }
      );

      if (response.data.success) {
        // Clear cart
        setCart([]);
        setShowCheckoutModal(false);

        toast.success(
          "Payment successful! You are now enrolled in the courses."
        );
        setActiveView("myCourses");
      } else {
        throw new Error(response.data.message || "Checkout failed");
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error(
        error.response?.data?.message || "Failed to complete checkout"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900">
      {/* Header */}
      <header className="bg-white py-6 px-4 sm:px-6 lg:px-8 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.button
            whileHover={{ x: -2 }}
            onClick={() => setActiveView("courseList")}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="mr-2" /> Back to Courses
          </motion.button>
          <div className="flex items-center">
            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
              {cart.length} {cart.length === 1 ? "Item" : "Items"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {cart.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="lg:w-2/3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-purple-50">
                  <h2 className="text-xl font-bold text-gray-900">
                    {cart.length} {cart.length === 1 ? "Course" : "Courses"} in
                    Cart
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Review your selections before checkout
                  </p>
                </div>

                <div className="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
                  <AnimatePresence>
                    {cart.map((course) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row">
                          <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
                            <img
                              src={`${base_url}/courses/${course.thumbnail.path}`}
                              alt={course.title}
                              className="w-full sm:w-40 h-24 object-cover rounded-lg shadow-sm"
                            />
                          </div>

                          <div className="flex-grow">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                                  {course.title}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {course.instructor}
                                </p>
                              </div>
                              <button
                                onClick={() => removeFromCart(course.id)}
                                className="text-gray-400 hover:text-red-500 p-1 -mt-2 -mr-2"
                              >
                                <FiX size={20} />
                              </button>
                            </div>

                            <div className="flex items-center text-sm text-gray-500 mb-3">
                              <span className="flex items-center mr-4">
                                <FiStar className="text-yellow-400 mr-1" />
                                {course.rating || 0} (
                                {(course.students || 0).toLocaleString()})
                              </span>
                            </div>

                            <div className="flex justify-between items-end">
                              <div>
                                {course.price > 0 ? (
                                  <span className="text-lg font-bold text-gray-600">
                                    ৳ {(course.price || 0).toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-lg font-bold text-green-600">
                                    Free
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <FiCreditCard className="mr-2 text-gray-600" />
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  {cart.map((course) => (
                    <div
                      key={course.id}
                      className="flex justify-between items-start"
                    >
                      <div className="flex items-start">
                        <img
                          src={`${base_url}/courses/${course.thumbnail.path}`}
                          alt={course.title}
                          className="w-12 h-9 object-cover rounded mr-3"
                        />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                            {course.title || "Untitled Course"}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {course.instructor || "Unknown Instructor"}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">
                        ৳{(course.price || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">৳ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">৳ 0.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2">
                    <span>Total</span>
                    <span>৳ {total.toFixed(2)}</span>
                  </div>
                </div>

                {hasFreeCourses && !hasPremiumCourses ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEnrollFreeCourses}
                    className="w-full mt-6 py-3 px-4 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <FiCheckCircle className="mr-2" />
                    Enroll Now
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openCheckoutModal}
                    className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-lg shadow-md hover:from-gray-700 hover:to-gray-900 transition-colors flex items-center justify-center"
                  >
                    <FiCreditCard className="mr-2" />
                    Proceed to Checkout
                  </motion.button>
                )}

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800">
                        What's included
                      </h4>
                      <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
                        <li>Lifetime access</li>
                        <li>Certificate of completion</li>
                        <li>30-day money-back guarantee</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-16"
          >
            <div className="mx-auto w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <FiShoppingCart size={40} className="text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Your cart is empty
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Discover amazing courses to boost your skills and add them to your
              cart
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView("courseList")}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 transition-colors"
            >
              Browse Courses
            </motion.button>
          </motion.div>
        )}
      </main>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            >
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FiCreditCard className="mr-2 text-gray-600" />
                  Secure Checkout
                </h2>
                <button
                  onClick={closeCheckoutModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <FiX size={24} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                <Checkout cart={cart} onSuccess={handleCheckoutSuccess} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart;
