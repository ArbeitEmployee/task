/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
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
import toast from "react-hot-toast";
import axios from "axios";
import { MdDelete } from "react-icons/md";

const Studentpaper = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gradingData, setGradingData] = useState({});
  const [totalScore, setTotalScore] = useState(0);
  const [maxTotalScore, setMaxTotalScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [passed, setPassed] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [lockedQuestions, setLockedQuestions] = useState({});

  // Get teacher ID from localStorage
  const teacherData = JSON.parse(localStorage.getItem("teacherData"));
  const teacherId = teacherData?._id;

  // Fetch all student submissions
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${base_url}/api/teacher/all-submissions`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
          },
        }
      );
      setSubmissions(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to fetch submissions");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Handle grading submission
  const handleGradeSubmission = async () => {
    try {
      const answersToSubmit = Object.values(gradingData).map((answer) => ({
        answerId: answer.answerId,
        question: answer.question,
        marks: Number(answer.marks),
        feedback: answer.feedback,
        isCorrect: answer.marks >= answer.maxMarks * 0.5,
      }));

      const response = await axios.put(
        `${base_url}/api/teacher/grade-submission`,
        {
          contentTitle: selectedSubmission.contentItem.title,
          answers: answersToSubmit,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setIsModalOpen(false);
        fetchSubmissions();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error grading submission:", error);
      toast.error(
        error.response?.data?.message || "Failed to grade submission"
      );
    }
  };

  // Filter submissions based on search and filter
  const filteredSubmissions = submissions.filter((submission) => {
    // Only show quiz submissions
    if (submission.contentItem.type !== "quiz") {
      return false;
    }

    const matchesSearch =
      submission.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.contentItem.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "ungraded" &&
        submission.gradingStatus !== "manually-graded") ||
      (filter === "graded" && submission.gradingStatus === "manually-graded");

    return matchesSearch && matchesFilter;
  });
  // Toggle question expansion
  const toggleQuestionExpansion = (questionId) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // View submission details
  const viewSubmission = (submission) => {
    setSelectedSubmission(submission);
    const storedLocks = loadLocks(submission);
    // Initialize grading data and calculate totals
    const initialGradingData = {};
    let total = 0;
    let maxTotal = 0;
    const initialExpanded = {};

    submission.answers.forEach((answer, index) => {
      // Use answerId as unique key instead of question text
      const answerKey = answer.answerId || `${answer.question}-${index}`;

      // Handle different answer formats
      let studentAnswer = answer.studentAnswer;

      // If it's a single MCQ stored as an object, extract the value
      if (
        (answer.type === "mcq-single" ||
          answer.questionType === "mcq-single") &&
        typeof studentAnswer === "object" &&
        studentAnswer !== null
      ) {
        if (studentAnswer.text) {
          studentAnswer = studentAnswer.text;
        } else if (studentAnswer.value) {
          studentAnswer = studentAnswer.value;
        } else if (studentAnswer.option) {
          studentAnswer = studentAnswer.option;
        }
      }

      initialGradingData[answerKey] = {
        answerId: answer.answerId,
        question: answer.question,
        type: answer.type || answer.questionType, // Handle both possible field names
        marks: answer.marksObtained || 0,
        feedback: answer.feedback || answer.teacherFeedback || "",
        maxMarks: answer.maxMarks,
        studentAnswer: studentAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect || false,
        locked: Boolean(storedLocks[answerKey]),
      };

      // Auto-expand the first question using answerKey
      initialExpanded[answerKey] = index === 0;

      total += answer.marksObtained || 0;
      maxTotal += answer.maxMarks;
    });

    setGradingData(initialGradingData);
    setExpandedQuestions(initialExpanded);
    setTotalScore(total);
    setMaxTotalScore(maxTotal);
    calculateResults(total, maxTotal, submission);
    setIsModalOpen(true);
  };

  // Calculate percentage and pass/fail status
  const PASS_THRESHOLD_PERCENT = 40;

  // 2) REPLACE your existing calculateResults with this:
  const calculateResults = (score, maxScore, _submission = null) => {
    const calculatedPercentage =
      maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    // Pass if percentage is >= 40%, otherwise fail
    const isPassed = calculatedPercentage >= PASS_THRESHOLD_PERCENT;

    setPercentage(calculatedPercentage);
    setPassed(isPassed);
  };

  const getSubmissionPercentage = (s) => {
    if (
      typeof s?.score !== "number" ||
      typeof s?.maxScore !== "number" ||
      s.maxScore <= 0
    )
      return null;
    return Math.round((s.score / s.maxScore) * 100);
  };

  const isSubmissionPassed = (s) => {
    const pct = getSubmissionPercentage(s);
    if (pct === null) return null; // not graded yet
    return pct >= PASS_THRESHOLD_PERCENT;
  };
  // Update grading data and recalculate totals
  const handleGradeChange = (question, field, value) => {
    const updatedGradingData = {
      ...gradingData,
      [question]: {
        ...gradingData[question],
        [field]: value,
        isCorrect:
          field === "marks"
            ? Number(value) >= gradingData[question].maxMarks * 0.5
            : gradingData[question].isCorrect,
      },
    };

    // Calculate new totals
    let newTotal = 0;
    Object.values(updatedGradingData).forEach((answer) => {
      newTotal += Number(answer.marks) || 0;
    });

    setGradingData(updatedGradingData);
    setTotalScore(newTotal);
    calculateResults(newTotal, maxTotalScore, selectedSubmission);
  };

  // Auto-grade function for MCQ questions
  const autoGradeMCQ = (answerKey) => {
    setGradingData((prev) => {
      const answerData = prev[answerKey];
      if (!answerData) return prev;

      // compute correctness
      let isCorrect = false;
      const { type, studentAnswer, correctAnswer } = answerData;

      if (type === "mcq-single") {
        isCorrect = studentAnswer === correctAnswer;
      } else if (type === "mcq-multiple") {
        if (Array.isArray(studentAnswer) && Array.isArray(correctAnswer)) {
          isCorrect =
            studentAnswer.length === correctAnswer.length &&
            studentAnswer.every((ans) => correctAnswer.includes(ans));
        }
      }

      const marks = isCorrect ? answerData.maxMarks : 0;

      // build the new grading data WITH the lock set
      const updated = {
        ...prev,
        [answerKey]: {
          ...answerData,
          marks,
          isCorrect,
          locked: true, // 🔒 lock immediately
        },
      };

      // recompute totals immediately for instant summary update
      const newTotal = Object.values(updated).reduce(
        (sum, a) => sum + (Number(a.marks) || 0),
        0
      );
      setTotalScore(newTotal);
      calculateResults(newTotal, maxTotalScore, selectedSubmission);

      // persist lock instantly
      const locks = loadLocks(selectedSubmission);
      locks[answerKey] = true;
      saveLocks(selectedSubmission, locks);

      return updated; // ✅ this triggers the re-render that uses `isLocked`
    });

    // no return needed
  };

  // Auto-grade all MCQ questions
  const autoGradeAllMCQs = () => {
    let newTotal = 0;
    const locks = loadLocks(selectedSubmission);

    Object.entries(gradingData).forEach(([answerKey, answer]) => {
      if (answer.type === "mcq-single" || answer.type === "mcq-multiple") {
        newTotal += autoGradeMCQ(answerKey); // this sets gradingData + saves lock
        locks[answerKey] = true; // make sure persisted set contains it
      } else {
        newTotal += answer.marks || 0;
      }
    });

    saveLocks(selectedSubmission, locks);
    setTotalScore(newTotal);
    calculateResults(newTotal, maxTotalScore, selectedSubmission);
    toast.success("Auto-graded all MCQ questions");
  };

  // Toggle correct/incorrect status for a question
  const toggleCorrectStatus = (answerKey) => {
    const currentData = gradingData[answerKey];
    if (!currentData || currentData.locked) return; // 🚫 ignore if locked

    const newIsCorrect = !currentData.isCorrect;
    const newMarks = newIsCorrect ? currentData.maxMarks : 0;

    handleGradeChange(answerKey, "isCorrect", newIsCorrect);
    handleGradeChange(answerKey, "marks", newMarks);
  };

  // Format answer display based on type
  const formatAnswer = (answer, type) => {
    // Handle numeric answers (like MCQ option indices)
    if (typeof answer === "number") {
      return answer.toString();
    }

    if (Array.isArray(answer)) {
      return answer.join(", ");
    }

    if (type === "true-false") {
      return answer ? "True" : "False";
    }

    // Handle single MCQ answers that might be objects
    if (
      type === "mcq-single" &&
      typeof answer === "object" &&
      answer !== null
    ) {
      // If it's an object with text property, return the text
      if (answer.text) {
        return answer.text;
      }
      // If it's an object with value property, return the value
      if (answer.value) {
        return answer.value;
      }
      // If it's an object with option property, return the option
      if (answer.option) {
        return answer.option;
      }
      // Otherwise, stringify the object
      return JSON.stringify(answer);
    }

    return answer || "No answer provided";
  };
  // put this above the return()
  const hasMeaningfulValue = (val) => {
    const placeholderStrings = new Set([
      "no correct answer provided",
      "no answer provided",
      "n/a",
      "na",
      "none",
    ]);

    if (val === null || val === undefined) return false;

    if (typeof val === "string") {
      const s = val.trim();
      if (!s) return false;
      return !placeholderStrings.has(s.toLowerCase());
    }

    if (Array.isArray(val)) return val.length > 0;

    if (typeof val === "object") {
      // object is meaningful if any nested value is meaningful
      return Object.values(val).some((v) => hasMeaningfulValue(v));
    }

    // numbers and booleans are meaningful (e.g., 0 or false could be valid)
    if (typeof val === "number" || typeof val === "boolean") return true;

    return false;
  };
  const getSubmissionKey = (s) => {
    // Build a stable key per submission. Prefer an id if present, else fall back.
    return (
      s?.submissionId ||
      s?._id ||
      `${s?.courseTitle || ""}|${s?.contentItem?.title || ""}|${
        s?.studentId || s?.userId || ""
      }`
    );
  };

  const loadLocks = (submission) => {
    const key = `mcqLocks:${getSubmissionKey(submission)}`;
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
      return {};
    }
  };

  const saveLocks = (submission, locksObj) => {
    const key = `mcqLocks:${getSubmissionKey(submission)}`;
    localStorage.setItem(key, JSON.stringify(locksObj || {}));
  };

  const clearLocks = (submission) => {
    const key = `mcqLocks:${getSubmissionKey(submission)}`;
    localStorage.removeItem(key);
  };
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="flex w-full h-[100vh] bg-white overflow-hidden">
        {/* Sidebar Section */}

        {/* Main Content Section */}
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
                  Student Submissions
                </h1>
                <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
                  <div className="relative w-full md:w-64">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search submissions..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="w-full md:w-auto border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Submissions</option>
                    <option value="ungraded">Needs Grading</option>
                    <option value="graded">Graded</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assignment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
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
                              <div className="text-sm text-gray-900">
                                {submission.courseTitle}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {submission.contentItem.title}
                              </div>
                              <div className="text-sm text-gray-500 capitalize">
                                {submission.contentItem.type}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {submission.score !== undefined
                                  ? `${submission.score}/${submission.maxScore}`
                                  : "Not graded"}
                              </div>
                              {getSubmissionPercentage(submission) !== null && (
                                <div className="text-sm text-gray-500">
                                  {getSubmissionPercentage(submission)}%
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${
                                    submission.gradingStatus ===
                                    "manually-graded"
                                      ? "bg-green-100 text-green-800"
                                      : submission.gradingStatus ===
                                        "partially-graded"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                              >
                                {submission.gradingStatus === "manually-graded"
                                  ? "Graded"
                                  : submission.gradingStatus ===
                                    "partially-graded"
                                  ? "Partially Graded"
                                  : "Not Graded"}
                              </span>
                              {isSubmissionPassed(submission) !== null && (
                                <span
                                  className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
      ${
        isSubmissionPassed(submission)
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
                                >
                                  {isSubmissionPassed(submission)
                                    ? "Passed"
                                    : "Failed"}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => viewSubmission(submission)}
                                className="text-gray-600 hover:text-gray-900 mr-4 flex items-center"
                              >
                                <FiEye className="inline mr-1" /> View/Grade
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-6 py-4 text-center text-sm text-gray-500"
                          >
                            No submissions found matching your criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Grading Modal */}
            {isModalOpen && selectedSubmission && (
              <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[1000] p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                  {/* Modal Header */}
                  <div className="bg-gray-800 !text-white p-4 rounded-t-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl !text-white font-bold">
                          Grading: {selectedSubmission.contentItem.title}
                        </h2>
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
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          Assignment Type
                        </h3>
                        <p className="text-lg font-medium text-gray-800 capitalize">
                          {selectedSubmission.contentItem.type}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Submission Date
                        </h3>
                        <p className="text-lg font-medium text-gray-800">
                          {new Date(
                            selectedSubmission.lastAccessed
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Grading Summary */}
                    <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="mb-3 md:mb-0">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Grading Summary
                          </h3>
                          <div className="flex items-center mt-1">
                            <span className="text-2xl font-bold text-gray-800">
                              {totalScore}/{maxTotalScore}
                            </span>
                            <span className="ml-2 text-lg text-gray-600">
                              ({percentage}%)
                            </span>
                            <span
                              className={`ml-3 px-2 py-1 rounded-full text-sm font-medium 
                              ${
                                passed
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {passed ? "Passed" : "Failed"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={autoGradeAllMCQs}
                            className="px-4 py-2 bg-blue-100 text-gray-700 rounded-lg hover:bg-blue-200 text-sm flex items-center"
                          >
                            <FiCheck className="mr-2" /> Auto-Grade MCQs
                          </button>
                          <button
                            className="px-4 py-2 bg-blue-100 text-gray-700 rounded-lg hover:bg-blue-200 text-sm flex items-center"
                            onClick={() => {
                              const resetGradingData = {};
                              Object.keys(gradingData).forEach((answerKey) => {
                                resetGradingData[answerKey] = {
                                  ...gradingData[answerKey],
                                  marks: 0,
                                  isCorrect: false,
                                  locked: false, // 🔓 unlock in state
                                };
                              });
                              setGradingData(resetGradingData);
                              setTotalScore(0);
                              calculateResults(
                                0,
                                maxTotalScore,
                                selectedSubmission
                              );

                              clearLocks(selectedSubmission); // 🔓 remove persisted locks
                            }}
                          >
                            <FiXCircle className="mr-2" /> Reset All
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Questions List */}
                    <div className="space-y-4">
                      {selectedSubmission.answers.map((answer, index) => {
                        const aKey =
                          answer.answerId || `${answer.question}-${index}`;
                        const isLocked = gradingData[aKey]?.locked;

                        return (
                          <div
                            key={aKey}
                            className="border rounded-lg overflow-hidden"
                          >
                            {/* Question Header */}
                            <div
                              className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                              onClick={() => toggleQuestionExpansion(aKey)}
                            >
                              <div className="flex items-center">
                                <span className="bg-gray-200 text-gray-800 text-sm font-medium mr-3 px-2.5 py-0.5 rounded">
                                  Q{index + 1}
                                </span>
                                <h3 className="font-medium text-gray-800 line-clamp-1">
                                  {answer.question}
                                </h3>
                              </div>
                              <div className="flex items-center">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded mr-3 ${
                                    gradingData[aKey]?.isCorrect
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {gradingData[aKey]?.isCorrect
                                    ? "Correct"
                                    : "Incorrect"}
                                </span>
                                <span className="text-sm text-gray-500 mr-3">
                                  {gradingData[aKey]?.marks || 0}/
                                  {answer.maxMarks} pts
                                </span>
                                {expandedQuestions[aKey] ? (
                                  <FiChevronUp className="text-gray-500" />
                                ) : (
                                  <FiChevronDown className="text-gray-500" />
                                )}
                              </div>
                            </div>

                            {/* Question Content */}
                            {expandedQuestions[aKey] && (
                              <div className="p-4 bg-white">
                                {/* Question Type and Max Marks */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                  <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-gray-100 text-gray-800">
                                    {answer.questionType}
                                  </span>
                                  <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-purple-100 text-purple-800">
                                    Max Marks: {answer.maxMarks}
                                  </span>
                                </div>

                                {/* Student & Correct Answer */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div className="border rounded-lg p-3 bg-gray-50">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                      Student Answer:
                                    </h4>
                                    <div className="p-3 bg-white rounded border border-gray-200">
                                      <p className="text-sm text-gray-800 break-words">
                                        {formatAnswer(
                                          answer.studentAnswer,
                                          answer.questionType
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  {hasMeaningfulValue(answer.correctAnswer) && (
                                    <div className="border rounded-lg p-3 bg-gray-50">
                                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                                        Correct Answer:
                                      </h4>
                                      <div className="p-3 bg-white rounded border border-gray-200">
                                        <p className="text-sm text-gray-800 break-words">
                                          {formatAnswer(
                                            answer.correctAnswer,
                                            answer.questionType
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Grading Controls */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label
                                      htmlFor={`marks-${index}`}
                                      className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                      Marks Awarded
                                    </label>

                                    {isLocked ? (
                                      <div className="flex items-center">
                                        <span className="inline-block px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-800">
                                          {gradingData[aKey]?.marks || 0}
                                        </span>
                                        <span className="ml-2 text-sm text-gray-500">
                                          / {answer.maxMarks}
                                        </span>
                                        <span className="ml-2 text-xs text-gray-400 italic">
                                          (auto)
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center">
                                        <input
                                          type="number"
                                          id={`marks-${index}`}
                                          min="0"
                                          max={answer.maxMarks}
                                          step="0.5"
                                          value={gradingData[aKey]?.marks || 0}
                                          onChange={(e) => {
                                            const value = Math.min(
                                              Math.max(
                                                Number(e.target.value),
                                                0
                                              ),
                                              answer.maxMarks
                                            );
                                            handleGradeChange(
                                              aKey,
                                              "marks",
                                              value
                                            );
                                          }}
                                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                                        />
                                        <span className="ml-2 text-sm text-gray-500">
                                          / {answer.maxMarks}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Feedback - hidden for MCQs */}
                                  {!["mcq-single", "mcq-multiple"].includes(
                                    answer.questionType || answer.type
                                  ) && (
                                    <div>
                                      <label
                                        htmlFor={`feedback-${index}`}
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                      >
                                        Feedback
                                      </label>
                                      <textarea
                                        id={`feedback-${index}`}
                                        rows={2}
                                        value={
                                          gradingData[aKey]?.feedback || ""
                                        }
                                        onChange={(e) =>
                                          handleGradeChange(
                                            aKey,
                                            "feedback",
                                            e.target.value
                                          )
                                        }
                                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                                        placeholder="Provide feedback for the student..."
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Quick Actions */}
                                <div className="flex justify-end mt-4 space-x-2">
                                  {!isLocked && (
                                    <>
                                      <button
                                        onClick={() =>
                                          toggleCorrectStatus(aKey)
                                        }
                                        className={`px-3 py-1 rounded-md text-sm flex items-center ${
                                          gradingData[aKey]?.isCorrect
                                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                                            : "bg-green-100 text-green-700 hover:bg-green-200"
                                        }`}
                                      >
                                        {gradingData[aKey]?.isCorrect ? (
                                          <>
                                            <FiXCircle className="mr-1" /> Mark
                                            Incorrect
                                          </>
                                        ) : (
                                          <>
                                            <FiCheck className="mr-1" /> Mark
                                            Correct
                                          </>
                                        )}
                                      </button>

                                      {(answer.questionType === "mcq-single" ||
                                        answer.questionType ===
                                          "mcq-multiple") && (
                                        <button
                                          onClick={() => autoGradeMCQ(aKey)}
                                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 flex items-center"
                                        >
                                          <FiCheck className="mr-1" />{" "}
                                          Auto-Grade
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Grading as:{" "}
                      <span className="font-medium">
                        {teacherData?.full_name || "Teacher"}
                      </span>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleGradeSubmission}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Submit Grades
                      </button>
                    </div>
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

export default Studentpaper;
