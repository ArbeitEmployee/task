/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
  FiEdit2,
  FiSave,
  FiX,
  FiLock,
  FiEye,
  FiEyeOff,
  FiPhone,
  FiUser,
  FiMail,
  FiBriefcase,
  FiDollarSign,
  FiFileText,
  FiLinkedin,
  FiUpload,
  FiTrash2,
  FiFile,
} from "react-icons/fi";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const TeacherSettings = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [teacherData, setTeacherData] = useState({
    full_name: "",
    email: "",
    phone: "",
    specialization: "",
    qualifications: "",
    linkedin_url: "",
    hourly_rate: 0,
    profile_photo: "",
    isVerified: false,
    createdAt: "",
  });
  const [editMode, setEditMode] = useState({
    full_name: false,
    phone: false,
    specialization: false,
    qualifications: false,
    linkedin_url: false,
    hourly_rate: false,
  });
  const [tempData, setTempData] = useState({});
  const [activeTab, setActiveTab] = useState("profile");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [newDocument, setNewDocument] = useState({
    name: "",
    file: null,
  });
  const [loading, setLoading] = useState({
    profile: false,
    password: false,
    photo: false,
    documents: false,
  });

  // Get teacher ID from localStorage
  const teacherDataLocal = JSON.parse(localStorage.getItem("teacherData"));
  const teacherId = teacherDataLocal?._id;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Fetch teacher data
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const response = await axios.get(
          `${base_url}/api/teacher/teacher-profile/${teacherId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
            },
          }
        );

        const data = response.data.data;
        setTeacherData({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          specialization: data.specialization || "",
          qualifications: data.qualifications || "",
          linkedin_url: data.linkedin_url || "",
          hourly_rate: data.hourly_rate || 0,
          profile_photo: data.profile_photo || "",
          isVerified: data.isVerified || false,
          createdAt: data.createdAt || "",
        });

        // Fetch documents if they exist
        if (data.documents) {
          setDocuments(data.documents);
        }
      } catch (error) {
        console.error("Error fetching teacher data:", error);
        toast.error("Failed to load teacher profile");
      }
    };

    fetchTeacherData();
  }, [teacherId]);

  // Handle edit toggle
  const handleEditToggle = (field) => {
    if (editMode[field]) {
      setEditMode({ ...editMode, [field]: false });
    } else {
      setTempData({ ...teacherData });
      setEditMode({ ...editMode, [field]: true });
    }
  };

  // Handle profile field changes
  const handleProfileChange = (e, field) => {
    const value = e.target.value;
    setTempData({ ...tempData, [field]: value });
  };

  // Save updated profile fields
  const saveProfile = async (field) => {
    if (!tempData[field] || tempData[field] === teacherData[field]) {
      setEditMode({ ...editMode, [field]: false });
      return;
    }

    try {
      setLoading({ ...loading, profile: true });
      const token = localStorage.getItem("teacherToken");

      const response = await axios.put(
        `${base_url}/api/teacher/update-profile/${teacherId}`,
        { [field]: tempData[field] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTeacherData((prev) => ({ ...prev, [field]: tempData[field] }));
      setEditMode((prev) => ({ ...prev, [field]: false }));
      toast.success(`${field.replace(/_/g, " ")} updated successfully!`);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || `Failed to update ${field}`);
    } finally {
      setLoading({ ...loading, profile: false });
    }
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    switch (field) {
      case "current":
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case "new":
        setShowNewPassword(!showNewPassword);
        break;
      case "confirm":
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };

  // Submit new password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, password: true });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      setLoading({ ...loading, password: false });
      return;
    }

    try {
      await axios.put(
        `${base_url}/api/teacher/update-password/${teacherId}`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
          },
        }
      );

      toast.success("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordChange(false);
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setLoading({ ...loading, password: false });
    }
  };

  // Handle profile photo change
  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading({ ...loading, photo: true });
      const token = localStorage.getItem("teacherToken");
      const formData = new FormData();
      formData.append("profile_photo", file);

      const response = await axios.put(
        `${base_url}/api/teacher/update-profile-photo/${teacherId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTeacherData((prev) => ({
        ...prev,
        profile_photo: response.data.data.profile_photo,
      }));
      toast.success("Profile photo updated successfully!");
    } catch (error) {
      console.error("Error updating profile photo:", error);
      toast.error("Failed to update profile photo");
    } finally {
      setLoading({ ...loading, photo: false });
    }
  };

  // Handle document input change
  const handleDocumentInputChange = (e) => {
    const { name, value } = e.target;
    setNewDocument({
      ...newDocument,
      [name]: value,
    });
  };

  // Handle document file change
  const handleDocumentFileChange = (e) => {
    setNewDocument({
      ...newDocument,
      file: e.target.files[0],
    });
  };

  // Handle document upload
  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!newDocument.name || !newDocument.file) {
      toast.error("Please provide both document name and file");
      return;
    }

    try {
      setLoading({ ...loading, documents: true });
      const token = localStorage.getItem("teacherToken");
      const formData = new FormData();
      formData.append("name", newDocument.name);
      formData.append("document", newDocument.file);

      const response = await axios.post(
        `${base_url}/api/teacher/upload-document/${teacherId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDocuments([...documents, response.data.document]);
      setNewDocument({
        name: "",
        file: null,
      });
      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error(error.response?.data?.message || "Failed to upload document");
    } finally {
      setLoading({ ...loading, documents: false });
    }
  };

  // Handle delete document
  const handleDeleteDocument = async (documentId) => {
    try {
      setLoading({ ...loading, documents: true });
      await axios.delete(
        `${base_url}/api/teacher/delete-document/${teacherId}/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
          },
        }
      );

      setDocuments(documents.filter((doc) => doc._id !== documentId));
      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error(error.response?.data?.message || "Failed to delete document");
    } finally {
      setLoading({ ...loading, documents: false });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gray-50 px-6 py-5 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Teacher Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your professional information and account settings
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === "profile"
                ? "border-gray-500 text-gray-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === "password"
                ? "border-gray-500 text-gray-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === "documents"
                ? "border-gray-500 text-gray-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Documents
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Profile Photo Section */}
            <div className="flex flex-col sm:flex-row items-center mb-8 gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-300 flex items-center justify-center">
                  {teacherData.profile_photo ? (
                    <img
                      src={`${base_url}/uploads/teachers/${teacherData.profile_photo}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser className="text-gray-400" size={32} />
                  )}
                </div>
                <label
                  htmlFor="profilePhoto"
                  className="absolute bottom-0 right-0 p-2 bg-gray-800 text-white rounded-full cursor-pointer hover:bg-gray-900 transition-colors"
                  title="Change photo"
                >
                  <FiEdit2 size={16} />
                  <input
                    type="file"
                    id="profilePhoto"
                    onChange={handleProfilePhotoChange}
                    className="hidden"
                    accept="image/*"
                    disabled={loading.photo}
                  />
                </label>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-semibold text-gray-800">
                  {teacherData.full_name || "Teacher User"}
                </h2>
                <p className="text-gray-600">{teacherData.email}</p>
                <div className="mt-2 flex items-center justify-center sm:justify-start space-x-4 text-sm text-gray-500">
                  <span>
                    Joined{" "}
                    {teacherData.createdAt
                      ? formatDate(teacherData.createdAt)
                      : ""}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      teacherData.isVerified
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {teacherData.isVerified ? "Verified" : "Not Verified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Full Name Field */}
            <div className="border-b border-gray-100 pb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <FiUser className="mr-2" size={16} />
                  Full Name
                </label>
                {editMode.full_name ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => saveProfile("full_name")}
                      className="p-1.5 rounded-md bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                      disabled={loading.profile}
                    >
                      <FiSave size={16} />
                    </button>
                    <button
                      onClick={() => handleEditToggle("full_name")}
                      className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditToggle("full_name")}
                    className="p-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <FiEdit2 size={16} />
                  </button>
                )}
              </div>
              {editMode.full_name ? (
                <input
                  type="text"
                  value={tempData.full_name || ""}
                  onChange={(e) => handleProfileChange(e, "full_name")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-500"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-gray-800">
                  {teacherData.full_name || "Not provided"}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="border-b border-gray-100 pb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <FiMail className="mr-2" size={16} />
                  Email Address
                </label>
                <span className="text-xs text-gray-500">Cannot be changed</span>
              </div>
              <p className="text-gray-800">{teacherData.email}</p>
              {!teacherData.isVerified && (
                <p className="text-sm text-yellow-600 mt-1">
                  Your email is not verified. Please check your inbox for
                  verification instructions.
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div className="border-b border-gray-100 pb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <FiPhone className="mr-2" size={16} />
                  Phone Number
                </label>
                {editMode.phone ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => saveProfile("phone")}
                      className="p-1.5 rounded-md bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                      disabled={loading.profile}
                    >
                      <FiSave size={16} />
                    </button>
                    <button
                      onClick={() => handleEditToggle("phone")}
                      className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditToggle("phone")}
                    className="p-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <FiEdit2 size={16} />
                  </button>
                )}
              </div>
              {editMode.phone ? (
                <input
                  type="tel"
                  value={tempData.phone || ""}
                  onChange={(e) => handleProfileChange(e, "phone")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-500"
                  placeholder="Enter phone number"
                />
              ) : (
                <p className="text-gray-800">
                  {teacherData.phone || "Not provided"}
                </p>
              )}
            </div>

            {/* Specialization Field */}
            <div className="border-b border-gray-100 pb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <FiBriefcase className="mr-2" size={16} />
                  Specialization
                </label>
                {editMode.specialization ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => saveProfile("specialization")}
                      className="p-1.5 rounded-md bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                      disabled={loading.profile}
                    >
                      <FiSave size={16} />
                    </button>
                    <button
                      onClick={() => handleEditToggle("specialization")}
                      className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditToggle("specialization")}
                    className="p-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <FiEdit2 size={16} />
                  </button>
                )}
              </div>
              {editMode.specialization ? (
                <input
                  type="text"
                  value={tempData.specialization || ""}
                  onChange={(e) => handleProfileChange(e, "specialization")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-500"
                  placeholder="Enter your specialization"
                />
              ) : (
                <p className="text-gray-800">
                  {teacherData.specialization || "Not provided"}
                </p>
              )}
            </div>

            {/* Hourly Rate Field */}
            <div className="border-b border-gray-100 pb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <FiDollarSign className="mr-2" size={16} />
                  Hourly Rate ($)
                </label>
                {editMode.hourly_rate ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => saveProfile("hourly_rate")}
                      className="p-1.5 rounded-md bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                      disabled={loading.profile}
                    >
                      <FiSave size={16} />
                    </button>
                    <button
                      onClick={() => handleEditToggle("hourly_rate")}
                      className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditToggle("hourly_rate")}
                    className="p-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <FiEdit2 size={16} />
                  </button>
                )}
              </div>
              {editMode.hourly_rate ? (
                <input
                  type="number"
                  value={tempData.hourly_rate || 0}
                  onChange={(e) => handleProfileChange(e, "hourly_rate")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-500"
                  min="0"
                  step="0.01"
                />
              ) : (
                <p className="text-gray-800">
                  ${teacherData.hourly_rate || 0}/hour
                </p>
              )}
            </div>

            {/* Qualifications Field */}
            <div className="border-b border-gray-100 pb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <FiFileText className="mr-2" size={16} />
                  Qualifications
                </label>
                {editMode.qualifications ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => saveProfile("qualifications")}
                      className="p-1.5 rounded-md bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                      disabled={loading.profile}
                    >
                      <FiSave size={16} />
                    </button>
                    <button
                      onClick={() => handleEditToggle("qualifications")}
                      className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditToggle("qualifications")}
                    className="p-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <FiEdit2 size={16} />
                  </button>
                )}
              </div>
              {editMode.qualifications ? (
                <textarea
                  value={tempData.qualifications || ""}
                  onChange={(e) => handleProfileChange(e, "qualifications")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-500"
                  rows={3}
                  placeholder="Enter your qualifications"
                />
              ) : (
                <p className="text-gray-800 whitespace-pre-line">
                  {teacherData.qualifications || "Not provided"}
                </p>
              )}
            </div>

            {/* LinkedIn URL Field */}
            <div className="border-b border-gray-100 pb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <FiLinkedin className="mr-2" size={16} />
                  LinkedIn Profile
                </label>
                {editMode.linkedin_url ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => saveProfile("linkedin_url")}
                      className="p-1.5 rounded-md bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                      disabled={loading.profile}
                    >
                      <FiSave size={16} />
                    </button>
                    <button
                      onClick={() => handleEditToggle("linkedin_url")}
                      className="p-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditToggle("linkedin_url")}
                    className="p-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <FiEdit2 size={16} />
                  </button>
                )}
              </div>
              {editMode.linkedin_url ? (
                <input
                  type="url"
                  value={tempData.linkedin_url || ""}
                  onChange={(e) => handleProfileChange(e, "linkedin_url")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-500"
                  placeholder="https://www.linkedin.com/in/yourprofile"
                />
              ) : teacherData.linkedin_url ? (
                <a
                  href={teacherData.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {teacherData.linkedin_url}
                </a>
              ) : (
                <p className="text-gray-800">Not provided</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "password" && (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <FiLock className="mr-2" size={16} />
                  Password
                </label>
                <button
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  {showPasswordChange ? "Cancel" : "Change Password"}
                </button>
              </div>

              <AnimatePresence>
                {showPasswordChange && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4 mt-3">
                      <form
                        onSubmit={handlePasswordSubmit}
                        className="space-y-4"
                      >
                        {/* Current Password */}
                        <div>
                          <label
                            htmlFor="currentPassword"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              id="currentPassword"
                              name="currentPassword"
                              type={showCurrentPassword ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              required
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-500 pr-10"
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                togglePasswordVisibility("current")
                              }
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showCurrentPassword ? (
                                <FiEye size={18} />
                              ) : (
                                <FiEyeOff size={18} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* New Password */}
                        <div>
                          <label
                            htmlFor="newPassword"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              id="newPassword"
                              name="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              required
                              minLength="6"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-500 pr-10"
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility("new")}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showNewPassword ? (
                                <FiEye size={18} />
                              ) : (
                                <FiEyeOff size={18} />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Password must be at least 6 characters long
                          </p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              id="confirmPassword"
                              name="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              required
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-500 pr-10"
                              placeholder="Confirm new password"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                togglePasswordVisibility("confirm")
                              }
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showConfirmPassword ? (
                                <FiEye size={18} />
                              ) : (
                                <FiEyeOff size={18} />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="pt-2">
                          <motion.button
                            type="submit"
                            disabled={loading.password}
                            className="cursor-pointer w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            whileHover={{
                              scale: 1.005,
                              boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.2)",
                            }}
                            whileTap={{ scale: 1.005 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {loading.password
                              ? "Updating..."
                              : "Update Password"}
                          </motion.button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-800">
              Your Documents
            </h2>
            <p className="text-gray-600 text-sm">
              Upload your certificates, diplomas, or other relevant documents to
              verify your qualifications.
            </p>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4">
              <form onSubmit={handleDocumentUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newDocument.name}
                    onChange={handleDocumentInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-500"
                    placeholder="e.g., Teaching Certificate, Degree, etc."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document File
                  </label>
                  <div className="flex items-center">
                    <label className="flex-1">
                      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                        {newDocument.file
                          ? newDocument.file.name
                          : "Choose file..."}
                      </div>
                      <input
                        type="file"
                        onChange={handleDocumentFileChange}
                        className="hidden"
                        required
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        document.querySelector('input[type="file"]').click()
                      }
                      className="ml-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <FiUpload size={20} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB)
                  </p>
                </div>

                <div className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={loading.documents}
                    className="cursor-pointer w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    whileHover={{
                      scale: 1.005,
                      boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.2)",
                    }}
                    whileTap={{ scale: 1.005 }}
                  >
                    {loading.documents ? "Uploading..." : "Upload Document"}
                  </motion.button>
                </div>
              </form>
            </div>

            {documents.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-800">
                  Uploaded Documents
                </h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Document Name
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Type
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Upload Date
                        </th>
                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {documents.map((document) => (
                        <tr key={document._id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {document.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {document.fileType}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(document.uploadDate).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <a
                              href={`${base_url}/${document.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-gray-900 mr-4"
                            >
                              View
                            </a>
                            <button
                              onClick={() => handleDeleteDocument(document._id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={loading.documents}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FiFile className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No documents
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload your certificates, diplomas, or other relevant
                  documents.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TeacherSettings;
