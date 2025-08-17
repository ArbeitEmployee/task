import React, { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import SubadminCreate from "../adminDashboard/subadmins/SubadminCreate";
import SubadminList from "./subadmins/SubadminList";
import TeacherRegistration from "./teacher/teacherRegister";
import TeacherList from "./teacher/teacherList";
import Notifications from "./notifications";
import Settings from "./settings";
import StudentAuth from "./student/studentCreate";
import StudentList from "./student/studentList";
import CourseCreator from "./courses/courseCreate";
import CourseList from "./courses/courseList";
import Category from "./courses/category";
import CategoryList from "./courses/categoryList";
import HeroForm from "./Home/HeroForm";
import HeroModify from "./Home/HeroModify";
import EmployeeCreate from "./Employee/EmployeeCreate";
import ConsultationManagement from "./consultancy/ConsultationManagement";
import EmployeeList from "./Employee/EmployeeList";
import VisaRequestsList from "./visa/VisaRequestsList";
import VisaManagement from "./visa/visaManagement/VisaManagement";

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem("adminActiveView") || "dashboard";
  });

  const [viewingRequestId, setViewingRequestId] = useState(() => {
    return localStorage.getItem("adminViewingRequestId") || null;
  });
  const [notificationCount, setNotificationCount] = useState(0);

  // Save view to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("adminActiveView", activeView);
    if (activeView !== "visaManagement") {
      localStorage.removeItem("adminViewingRequestId");
    }
  }, [activeView]);
  useEffect(() => {
    if (viewingRequestId) {
      localStorage.setItem("adminViewingRequestId", viewingRequestId);
    }
  }, [viewingRequestId]);

  const handleViewRequest = (requestId) => {
    setActiveView("visaManagement");
    setViewingRequestId(requestId);
  };

  const handleBackToList = () => {
    setActiveView("visaRequests");
    setViewingRequestId(null);
  };

  const renderView = () => {
    switch (activeView) {
      case "subadminCreate":
        return <SubadminCreate />;
      case "subadminList":
        return <SubadminList />;
      case "createHero":
        return <HeroForm />;
      case "modifyHero":
        return <HeroModify />;
      case "TeacherRegistration":
        return (
          <TeacherRegistration setNotificationCount={setNotificationCount} />
        );
      case "teacherList":
        return <TeacherList />;
      case "StudentRegistration":
        return <StudentAuth />;
      case "studentList":
        return <StudentList />;
      case "createCourse":
        return <CourseCreator />;
      case "courseList":
        return <CourseList />;
      case "createCategory":
        return <Category />;
      case "modifyCategory":
        return <CategoryList />;
      case "employeeRegistration":
        return <EmployeeCreate />;
      case "employeeList":
        return <EmployeeList />;
      case "consultancyMangement":
        return <ConsultationManagement />;
      case "visaRequests":
        return <VisaRequestsList onViewRequest={handleViewRequest} />;
      case "visaManagement":
        return (
          <div className="bg-white rounded-xl shadow-md p-6">
            <button
              onClick={handleBackToList}
              className="mb-4 px-4 py-2 text-gray-500 rounded-md hover:text-gray-900 cursor-pointer"
            >
              ← Back to List
            </button>
            {viewingRequestId ? (
              <VisaManagement
                requestId={viewingRequestId}
                onBack={handleBackToList}
              />
            ) : (
              <div className="text-center py-10">
                <p className="text-red-500">No visa request selected</p>
                <button
                  onClick={handleBackToList}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Back to Visa Requests
                </button>
              </div>
            )}
          </div>
        );
      case "notifications":
        return <Notifications setNotificationCount={setNotificationCount} />;
      case "settings":
        return <Settings />;
      default:
        return <h1 className="p-6 text-xl font-bold">Dashboard Overview</h1>;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-300 min-h-screen flex items-center justify-center p-4">
      <div className="flex w-full max-w-8xl h-[95vh] bg-white rounded-3xl shadow-md overflow-hidden border border-gray-300">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          notificationCount={notificationCount}
          setNotificationCount={setNotificationCount}
        />
        <div className="flex-1 h-full overflow-auto">{renderView()}</div>
      </div>
    </div>
  );
};

export default AdminDashboard;
