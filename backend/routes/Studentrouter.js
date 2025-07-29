const express = require("express");
const Studentrouter = express.Router();
const studentAuth = require("../middleware/studentMiddleware");
const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const Course = require("../models/Course");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
// Protected route - Get student profile
Studentrouter.get("/profile/:id", studentAuth, async (req, res) => {
  try {
    const matchedstudent = await Student.findById(req.params.id).select(
      "-password -otp -otpExpires -resetPasswordToken -resetPasswordExpire -loginAttempts -lockUntil"
    );

    if (!matchedstudent) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found." });
    }

    // Verify the requesting student has permission to view this profile
    if (req.student._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this profile."
      });
    }

    res.status(200).json({ success: true, student: matchedstudent });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../public/students");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
});
// Protected route - Update student profile (excluding password)
Studentrouter.put(
  "/profile/:id",
  upload.single("profile_picture"), // This handles the file upload
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Remove restricted fields
      delete updates._id;
      delete updates.password;
      delete updates.isVerified;

      // If a file was uploaded, add it to updates
      if (req.file) {
        updates.profile_picture = req.file.filename;
      }

      const updatedStudent = await Student.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true
      }).select(
        "-password -otp -otpExpires -resetPasswordToken -resetPasswordExpire -loginAttempts -lockUntil"
      );

      if (!updatedStudent) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }

      res.status(200).json({
        success: true,
        student: updatedStudent,
        profile_picture: req.file?.filename // Include the filename in response if uploaded
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Protected route - Update student password
Studentrouter.put("/profile/:id/password", studentAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Verify the requesting student has permission to update this password
    if (req.student._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this password."
      });
    }

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required."
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters."
      });
    }

    // Find the student with password field selected
    const student = await Student.findById(id).select("+password");
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found." });
    }

    // Verify current password
    const isMatch = await student.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect." });
    }

    // Update password (let the pre-save middleware handle hashing)
    student.password = newPassword;
    await student.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// ------------------------------all-courses--------------------------------
Studentrouter.get("/all-courses", async (req, res) => {
  try {
    const allcourses = await Course.find();

    if (!allcourses) {
      return res.send({ success: false, message: "No courses found!" });
    }
    res.status(200).json({ success: true, courses: allcourses });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// @access  Private (Student)
Studentrouter.post("/enroll/:courseId", async (req, res) => {
  try {
    // Get the course
    const course = await Course.findById(req.params.courseId);
    console.log(req.body.userid);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    // Get the student (assuming student ID is in req.user from auth middleware)
    const student = await Student.findById(req.body.userid);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Check if already enrolled
    const isEnrolled = student.enrolledCourses.some(
      (c) => c.course.toString() === req.params.courseId
    );
    if (isEnrolled) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course"
      });
    }

    // Enroll the student using the method we defined in the model
    await student.enrollCourse(req.params.courseId);

    res.status(200).json({
      success: true,
      message: "Successfully enrolled in the course",
      enrolledCourses: student.enrolledCourses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});
// Get enrolled courses for a student
Studentrouter.get("/my-courses", async (req, res) => {
  try {
    // Populate the enrolledCourses with course details
    const student = await Student.findById(req.student._id)
      .populate({
        path: "enrolledCourses.course",
        select: "title description thumbnail instructor rating duration price"
      })
      .select("enrolledCourses");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Format the response
    const enrolledCourses = student.enrolledCourses.map((enrollment) => ({
      course: {
        id: enrollment.course._id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        thumbnail: enrollment.course.thumbnail,
        instructor: enrollment.course.instructor,
        rating: enrollment.course.rating,
        duration: enrollment.course.duration,
        price: enrollment.course.price
      },
      enrolledAt: enrollment.enrolledAt,
      progress: enrollment.progress,
      completed: enrollment.completed,
      lastAccessed: enrollment.lastAccessed,
      certificates: enrollment.certificates
    }));

    res.status(200).json({
      success: true,
      enrolledCourses,
      count: enrolledCourses.length
    });
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch enrolled courses",
      error: error.message
    });
  }
});

// Enroll in a course
Studentrouter.post("/:courseId/enroll", studentAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    console.log(req.body.user_id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if already enrolled
    const alreadyEnrolled = course.enrollments.some(
      (enrollment) =>
        enrollment.studentId.toString() === req.body.user_id.toString()
    );

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course"
      });
    }

    // Check if course is premium and user has access
    if (course.type === "premium" && !req.user.subscription.active) {
      return res.status(403).json({
        success: false,
        message: "Premium course requires an active subscription"
      });
    }

    // Initialize progress for each content item
    const progress = course.content.map((item) => ({
      contentItemId: item._id,
      completed: false,
      lastAccessed: new Date()
    }));

    // Create new enrollment
    const newEnrollment = {
      studentId: req.body.user_id,
      progress,
      lastAccessed: new Date()
    };

    course.enrollments.push(newEnrollment);
    await course.save();

    // Add course to user's enrolled courses
    await Student.findByIdAndUpdate(req.body.user_id, {
      $addToSet: { enrolledCourses: course._id }
    });

    res.status(200).json({
      success: true,
      message: "Successfully enrolled in the course",
      enrollment: newEnrollment
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
Studentrouter.get("/enrolled-courses/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    // Find all courses where the student is enrolled and populate necessary fields
    const courses = await Course.find({
      "enrollments.studentId": studentId
    })
      .populate("instructor", "name email profilePicture")
      .populate("enrollments.progress.answers.gradedBy", "name")
      .lean();

    if (!courses || courses.length === 0) {
      return res.status(200).json({
        success: true,
        enrolledCourses: [],
        message: "No enrolled courses found for this student"
      });
    }

    // Format the response
    const enrolledCourses = courses.map((course) => {
      const enrollment = course.enrollments.find(
        (e) => e.studentId.toString() === studentId
      );

      // Calculate progress statistics
      let totalQuestions = 0;
      let correctAnswers = 0;
      let totalMarksObtained = 0;
      let totalMaxMarks = 0;

      enrollment.progress.forEach((item) => {
        if (item.answers && item.answers.length > 0) {
          totalQuestions += item.answers.length;
          correctAnswers += item.answers.filter((a) => a.isCorrect).length;
          totalMarksObtained += item.answers.reduce(
            (sum, a) => sum + (a.marksObtained || 0),
            0
          );
          totalMaxMarks += item.answers.reduce(
            (sum, a) => sum + (a.maxMarks || 0),
            0
          );
        }
      });

      const accuracy =
        totalQuestions > 0
          ? Math.round((correctAnswers / totalQuestions) * 100)
          : 0;
      const overallPercentage =
        totalMaxMarks > 0
          ? Math.round((totalMarksObtained / totalMaxMarks) * 100)
          : 0;

      return {
        courseDetails: {
          _id: course._id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          instructor: course.instructor,
          duration: course.duration,
          price: course.price,
          type: course.type,
          category: course.category,
          totalLessons: course.content.filter((c) => c.type === "tutorial")
            .length,
          totalQuizzes: course.content.filter((c) => c.type === "quiz").length,
          totalContentItems: course.content.length
        },
        enrollmentInfo: {
          enrolledAt: enrollment.enrolledAt,
          completed: enrollment.completed,
          completedAt: enrollment.completedAt,
          lastAccessed: enrollment.lastAccessed,
          totalTimeSpent: enrollment.totalTimeSpent,
          certificate: enrollment.certificate,
          progress: calculateOverallProgress(enrollment.progress),
          progressDetails: enrollment.progress,
          stats: {
            totalQuestions,
            correctAnswers,
            incorrectAnswers: totalQuestions - correctAnswers,
            accuracy,
            totalMarksObtained,
            totalMaxMarks,
            overallPercentage
          }
        }
      };
    });

    res.status(200).json({
      success: true,
      enrolledCourses
    });
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching enrolled courses"
    });
  }
});

// Helper function to calculate overall progress
function calculateOverallProgress(progressItems) {
  if (!progressItems || progressItems.length === 0) return 0;

  const completedItems = progressItems.filter((item) => item.completed).length;
  return Math.round((completedItems / progressItems.length) * 100);
}

// Helper function to calculate overall progress percentage
function calculateOverallProgress(progressItems) {
  if (!progressItems || progressItems.length === 0) return 0;

  const totalItems = progressItems.length;
  const completedItems = progressItems.filter((item) => item.completed).length;

  return Math.round((completedItems / totalItems) * 100);
}

// Track course access (when student clicks Start/Continue)
Studentrouter.post("/:courseId/access", studentAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Find or create enrollment
    let enrollment = course.enrollments.find(
      (e) => e.studentId.toString() === req.user._id.toString()
    );

    const now = new Date();

    if (!enrollment) {
      // If not enrolled, create new enrollment with initialized progress
      enrollment = {
        studentId: req.user._id,
        enrolledAt: now,
        firstAccessedAt: now,
        lastAccessed: now,
        progress: course.content.map((item) => ({
          contentItemId: item._id,
          completed: false,
          timeSpent: 0
        })),
        totalTimeSpent: 0,
        accessHistory: [
          {
            accessedAt: now,
            duration: 0 // Will be updated when they leave the course
          }
        ]
      };
      course.enrollments.push(enrollment);
    } else {
      // Update last accessed time and add to access history
      enrollment.lastAccessed = now;
      enrollment.accessHistory.push({
        accessedAt: now,
        duration: 0
      });

      // Set first accessed time if not set
      if (!enrollment.firstAccessedAt) {
        enrollment.firstAccessedAt = now;
      }
    }

    await course.save();

    res.status(200).json({
      message: "Course access recorded",
      enrollment: {
        _id: enrollment._id,
        firstAccessedAt: enrollment.firstAccessedAt,
        lastAccessed: enrollment.lastAccessed
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get course progress for a student
Studentrouter.get("/:courseId/progress", studentAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const enrollment = course.enrollments.find(
      (e) => e.studentId.toString() === req.user._id.toString()
    );

    if (!enrollment) {
      return res
        .status(404)
        .json({ message: "You are not enrolled in this course" });
    }

    // Calculate overall progress
    const totalItems = course.content.length;
    const completedItems = enrollment.progress.filter(
      (p) => p.completed
    ).length;
    const progressPercentage =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    res.status(200).json({
      progress: enrollment.progress,
      overallProgress: progressPercentage,
      totalItems,
      completedItems,
      lastAccessed: enrollment.lastAccessed,
      totalTimeSpent: enrollment.totalTimeSpent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update progress for a content item
Studentrouter.put(
  "/:courseId/progress/:contentItemId",
  studentAuth,
  async (req, res) => {
    try {
      const { answers, completed, timeSpent } = req.body;
      const course = await Course.findById(req.params.courseId);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Find the enrollment
      const enrollmentIndex = course.enrollments.findIndex(
        (e) => e.studentId.toString() === req.user._id.toString()
      );

      if (enrollmentIndex === -1) {
        return res
          .status(404)
          .json({ message: "You are not enrolled in this course" });
      }

      // Find the progress item
      const progressIndex = course.enrollments[
        enrollmentIndex
      ].progress.findIndex(
        (p) => p.contentItemId.toString() === req.params.contentItemId
      );

      if (progressIndex === -1) {
        return res
          .status(404)
          .json({ message: "Content item not found in your progress" });
      }

      // Update progress
      const progressItem =
        course.enrollments[enrollmentIndex].progress[progressIndex];
      progressItem.lastAccessed = new Date();

      if (completed !== undefined) {
        progressItem.completed = completed;
        if (completed) {
          progressItem.completedAt = new Date();
        }
      }

      if (timeSpent) {
        progressItem.timeSpent = (progressItem.timeSpent || 0) + timeSpent;
        course.enrollments[enrollmentIndex].totalTimeSpent += timeSpent;
      }

      // Process answers if provided (for quizzes)
      if (answers && Array.isArray(answers)) {
        const contentItem = course.content.id(req.params.contentItemId);
        if (!contentItem || contentItem.type !== "quiz") {
          return res
            .status(400)
            .json({ message: "Content item is not a quiz or not found" });
        }

        let score = 0;
        const processedAnswers = answers
          .map((answer) => {
            const question = contentItem.questions.id(answer.questionId);
            if (!question) return null;

            let isCorrect = false;
            let marksObtained = 0;

            // Check answer correctness
            if (
              question.type === "mcq-single" ||
              question.type === "mcq-multiple"
            ) {
              const correctAnswers = Array.isArray(question.correctAnswer)
                ? question.correctAnswer
                : [question.correctAnswer];
              const studentAnswers = Array.isArray(answer.answer)
                ? answer.answer
                : [answer.answer];

              isCorrect =
                correctAnswers.length === studentAnswers.length &&
                correctAnswers.every((ans) => studentAnswers.includes(ans));
              marksObtained = isCorrect ? question.marks : 0;
            } else {
              // For subjective answers, mark as incomplete (needs teacher review)
              isCorrect = false;
              marksObtained = 0;
            }

            score += marksObtained;

            return {
              questionId: question._id,
              answer: answer.answer,
              isCorrect,
              marksObtained
            };
          })
          .filter(Boolean);

        progressItem.answers = processedAnswers;
        progressItem.score = score;
        progressItem.maxScore = contentItem.questions.reduce(
          (sum, q) => sum + q.marks,
          0
        );
      }

      // Update last accessed for the entire enrollment
      course.enrollments[enrollmentIndex].lastAccessed = new Date();

      await course.save();

      res.status(200).json({
        message: "Progress updated successfully",
        progress: progressItem
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);
// Get enrolled courses by student ID
Studentrouter.get("/enrolled/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validate studentId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    // Find all courses where the student is enrolled
    const enrolledCourses = await Course.find({
      "enrollments.studentId": studentId
    })
      .populate("instructor", "name email") // Populate instructor details
      .select("-content -attachments -previousInstructors -ratings"); // Exclude large/unnecessary fields

    if (!enrolledCourses || enrolledCourses.length === 0) {
      return res
        .status(404)
        .json({ message: "No enrolled courses found for this student" });
    }

    // Format the response to include enrollment details for each course
    const formattedCourses = enrolledCourses.map((course) => {
      // Find the specific enrollment for this student
      const enrollment = course.enrollments.find(
        (enroll) => enroll.studentId.toString() === studentId
      );

      return {
        _id: course._id,
        title: course.title,
        description: course.description,
        instructor: course.instructor,
        thumbnail: course.thumbnail,
        type: course.type,
        status: course.status,
        category: course.category,
        level: course.level,
        price: course.price,
        duration: course.duration,
        totalLessons: course.totalLessons,
        totalQuizzes: course.totalQuizzes,
        enrollment: {
          enrolledAt: enrollment.enrolledAt,
          completed: enrollment.completed,
          completedAt: enrollment.completedAt,
          progress: enrollment.progress.length,
          totalProgress: course.content.length,
          lastAccessed: enrollment.lastAccessed,
          totalTimeSpent: enrollment.totalTimeSpent,
          certificateIssued: enrollment.certificateIssued
        },
        createdAt: course.createdAt
      };
    });

    res.json(formattedCourses);
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching enrolled courses" });
  }
});
Studentrouter.get("/single-courses/:id", async (req, res) => {
  try {
    const course = await Course.findById({ _id: req.params.id });
    if (!course) {
      return res.send({ success: false, message: "COurse did not find." });
    }
    res.send({ success: true, data: course });
  } catch (error) {
    console.log(error);
  }
});

// Get course learning page with student progress

// -----------------single-course----------------------------------
Studentrouter.get("/course-overview/:id", async (req, res) => {
  try {
    console.log(req.params.id);
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.send({ success: false, message: "Course not found!" });
    }
    res.send({ success: true, course: course });
  } catch (error) {
    console.log(error);
  }
});

const PDFDocument = require("pdfkit");
const moment = require("moment");

// Generate and download certificate
Studentrouter.get("/certificate/:courseId/:studentId", async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(studentId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid course or student ID" });
    }

    // Find the course and enrollment
    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const enrollment = course.enrollments.find(
      (e) => e.studentId.toString() === studentId
    );
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Student not enrolled in this course"
      });
    }

    // Check if course is completed
    if (!enrollment.completed) {
      return res
        .status(400)
        .json({ success: false, message: "Course not completed yet" });
    }

    // Find student details
    const student = await Student.findById(studentId).select("full_name email");
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Create certificate if not already exists
    if (!enrollment.certificate) {
      enrollment.certificate = {
        certificateId: `CERT-${Date.now()}`,
        issuedAt: new Date(),
        verificationCode: generateVerificationCode(),
        downloadUrl: ""
      };
      await course.save();
    }

    // Generate PDF certificate
    const doc = new PDFDocument({
      layout: "landscape",
      size: "A4",
      margin: 0
    });

    // Generate safe filename
    const filename = `${course.title.replace(
      /[^\w\s.-]/gi,
      ""
    )}_Certificate_${student.full_name.replace(/[^\w\s.-]/gi, "")}.pdf`;
    const encodedFilename = encodeURIComponent(filename);

    // Set response headers with properly encoded filename
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
    );

    // Pipe the PDF to response
    doc.pipe(res);

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f8f9fa");

    // Border
    doc
      .strokeColor("#343a40")
      .lineWidth(20)
      .rect(10, 10, doc.page.width - 20, doc.page.height - 20)
      .stroke();

    // Logo (replace with your logo path)
    const logoPath = path.join(__dirname, "../public/images/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, doc.page.width / 2 - 50, 60, { width: 100 });
    }

    // Title
    doc
      .fontSize(36)
      .fill("#343a40")
      .text("Certificate of Completion", {
        align: "center",
        underline: true,
        lineGap: 10
      })
      .moveDown(0.5);

    // Subtitle
    doc
      .fontSize(18)
      .fill("#6c757d")
      .text("This is to certify that", { align: "center" })
      .moveDown(1);

    // Student name
    doc
      .fontSize(32)
      .fill("#007bff")
      .text(student.full_name, { align: "center", lineGap: 5 })
      .moveDown(0.5);

    // Completion text
    doc
      .fontSize(16)
      .fill("#6c757d")
      .text("has successfully completed the course", { align: "center" })
      .moveDown(1);

    // Course title
    doc
      .fontSize(24)
      .fill("#28a745")
      .text(`"${course.title}"`, { align: "center", lineGap: 5 })
      .moveDown(1.5);

    // Details
    doc
      .fontSize(14)
      .fill("#495057")
      .text(`Course Duration: ${course.duration} hours`, { align: "center" })
      .text(
        `Completion Date: ${moment(enrollment.completedAt).format(
          "MMMM Do, YYYY"
        )}`,
        { align: "center" }
      )
      .moveDown(2);

    // Verification
    doc
      .fontSize(12)
      .fill("#6c757d")
      .text(`Certificate ID: ${enrollment.certificate.certificateId}`, {
        align: "center"
      })
      .text(`Verification Code: ${enrollment.certificate.verificationCode}`, {
        align: "center"
      })
      .moveDown(3);

    // Signatures
    const signatureY = doc.page.height - 150;
    doc
      .fontSize(14)
      .text("________________________", 100, signatureY, { align: "left" })
      .text("Instructor Signature", 100, signatureY + 20, { align: "left" })
      .text("________________________", doc.page.width - 300, signatureY, {
        align: "right"
      })
      .text("Date", doc.page.width - 300, signatureY + 20, { align: "right" });

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate certificate",
      error: error.message
    });
  }
});

// Helper function to generate verification code
function generateVerificationCode() {
  return (
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10)
  );
}

module.exports = Studentrouter;
