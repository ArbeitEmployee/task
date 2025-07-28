const express = require("express");
const Adminrouter = express.Router();
const {
  authenticateToken,
  authorizeAdmin,
  authorizeSubAdmin,
  checkAccountStatus
} = require("../middleware/auth"); // Update the path accordingly
const Teacher = require("../models/Teacher");
const bcrypt = require("bcryptjs");
const Student = require("../models/Student");
const Course = require("../models/Course");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Admin = require("../models/Admin");
// Example of a protected admin route

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../public/courses");
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
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

Adminrouter.get("/profile/:id", authenticateToken, async (req, res) => {
  try {
    // Find user by ID
    const user = await Admin.findById(req.params.id).select(
      "-password -resetCode -resetCodeExpires"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Basic profile data for all roles
    const profileData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: "Profile retrieved successfully",
      profile: profileData
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile"
    });
  }
});

// -------------------------------------teachers-routes----------------------------------------
// Get all teachers
Adminrouter.get(
  "/teachers",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const teachers = await Teacher.find({}).select("-password -__v");

      res.json({
        success: true,
        count: teachers.length,
        data: teachers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error while fetching teachers"
      });
    }
  }
);

// Get single teacher by ID
Adminrouter.get(
  "/teachers/:id",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const teacher = await Teacher.findById(req.params.id).select(
        "-password -__v"
      );

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found"
        });
      }

      res.json({
        success: true,
        data: teacher
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching teacher"
      });
    }
  }
);

// Update teacher (all fields)
Adminrouter.put(
  "/teachers/:id",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const updates = req.body;

      // Prevent password updates through this route (should have separate password update route)
      if (updates.password) {
        return res.status(400).json({
          success: false,
          message: "Use the password reset route to change password"
        });
      }

      const updatedTeacher = await Teacher.findByIdAndUpdate(
        req.params.id,
        {
          ...updates,
          last_updated: Date.now()
        },
        { new: true, runValidators: true }
      ).select("-password -__v");

      if (!updatedTeacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found"
        });
      }

      res.json({
        success: true,
        message: "Teacher updated successfully",
        data: updatedTeacher
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while updating teacher"
      });
    }
  }
);
// Change teacher password
Adminrouter.put(
  "/teachers-update-password/:id",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: "New password is required"
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters"
        });
      }

      if (!/\d/.test(newPassword) || !/[!@#$%^&*]/.test(newPassword)) {
        return res.status(400).json({
          success: false,
          message: "Password must contain a number and a special character"
        });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      const updatedTeacher = await Teacher.findByIdAndUpdate(
        req.params.id,
        {
          password: hashedPassword,
          last_updated: Date.now()
        },
        { new: true }
      ).select("-password -__v");

      if (!updatedTeacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found"
        });
      }

      res.json({
        success: true,
        message: "Teacher password updated successfully",
        data: updatedTeacher
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while updating password"
      });
    }
  }
);
// Change teacher status
// In your teacherRoutes.js or adminRoutes.js
Adminrouter.put(
  "/teachers-status/:id",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const { status, rejection_reason } = req.body;

      // Validation (keep your existing validation)
      if (!status || !["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status is required and must be pending/approved/rejected"
        });
      }

      if (status === "rejected" && !rejection_reason) {
        return res.status(400).json({
          success: false,
          message: "Rejection reason is required"
        });
      }

      // Update teacher
      const updateData = {
        status,
        last_updated: Date.now(),
        ...(status === "rejected" && { rejection_reason }),
        ...(status !== "rejected" && { rejection_reason: undefined })
      };

      const updatedTeacher = await Teacher.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).select("-password -__v");

      if (!updatedTeacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found"
        });
      }

      // Get updated notification count
      const pendingCount = await Teacher.countDocuments({ status: "pending" });

      res.json({
        success: true,
        message: `Teacher ${status} successfully`,
        data: {
          teacher: updatedTeacher,
          notifications: {
            pending_count: pendingCount
          }
        }
      });
    } catch (error) {
      console.error("Teacher status update error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while updating teacher status"
      });
    }
  }
);
Adminrouter.get(
  "/notifications/count",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const count = await Teacher.countDocuments({ status: "pending" });
      res.json({ success: true, count });
    } catch (error) {
      console.error("Error getting notification count:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get notification count"
      });
    }
  }
);
// Delete single teacher
Adminrouter.delete(
  "/teachers/:id",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const deletedTeacher = await Teacher.findByIdAndDelete(req.params.id);

      if (!deletedTeacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found"
        });
      }

      res.json({
        success: true,
        message: "Teacher deleted successfully"
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while deleting teacher"
      });
    }
  }
);

// Delete multiple teachers
Adminrouter.delete(
  "/delete-all-teachers",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const { teacherIds } = req.body;

      if (
        !teacherIds ||
        !Array.isArray(teacherIds) ||
        teacherIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide an array of teacher IDs to delete"
        });
      }

      const result = await Teacher.deleteMany({ _id: { $in: teacherIds } });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "No teachers found to delete"
        });
      }

      res.json({
        success: true,
        message: `${result.deletedCount} teacher(s) deleted successfully`
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while deleting teachers"
      });
    }
  }
);

// ------------------------------------teacher-routes-------------------------------------------------

// -------------------------------------students-routes----------------------------------------
const studentstorage = multer.diskStorage({
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

const studentupload = multer({
  storage: studentstorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});
// Get all students
Adminrouter.get(
  "/students",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const students = await Student.find({}).select("-password -__v");

      res.json({
        success: true,
        count: students.length,
        data: students
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching students"
      });
    }
  }
);

// Get single student by ID
Adminrouter.get(
  "/students/:id",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const student = await Student.findById(req.params.id).select(
        "-password -__v"
      );

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found"
        });
      }

      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching student"
      });
    }
  }
);

// Create new student
Adminrouter.post(
  "/students",
  authenticateToken,
  authorizeSubAdmin,
  studentupload.single("profile_picture"), // Handle single file upload
  async (req, res) => {
    try {
      const { email, password, full_name, phone, date_of_birth, address } =
        req.body;
      const profilePhoto = req.file;

      const existingStudent = await Student.findOne({ email });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: "Student with this email already exists"
        });
      }

      // Create student with optional profile photo
      const studentData = {
        email,
        password,
        full_name,
        phone,
        date_of_birth,
        address,
        isVerified: true
      };

      if (profilePhoto) {
        studentData.profile_picture = req.file.filename; // Make sure this matches what frontend expects
      }

      const newStudent = await Student.create(studentData);

      // Remove password from the response
      const studentResponse = newStudent.toObject();
      delete studentResponse.password;

      res.status(201).json({
        success: true,
        message: "Student created successfully",
        data: {
          ...newStudent.toObject(),
          password: undefined, // Remove password
          profile_picture: newStudent.profile_picture // Ensure this has the uploaded filename
        }
      });
    } catch (error) {
      console.error(error);
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: Object.values(error.errors).map((val) => val.message)
        });
      }
      res.status(500).json({
        success: false,
        message: "Server error while creating student"
      });
    }
  }
);
// Update student (all fields except password)
Adminrouter.put(
  "/students/:id",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const updates = req.body;

      // Prevent password updates through this route
      if (updates.password) {
        return res.status(400).json({
          success: false,
          message: "Use the password update route to change password"
        });
      }

      const updatedStudent = await Student.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      ).select("-password -__v");

      if (!updatedStudent) {
        return res.status(404).json({
          success: false,
          message: "Student not found"
        });
      }

      res.json({
        success: true,
        message: "Student updated successfully",
        data: updatedStudent
      });
    } catch (error) {
      console.error(error);
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: Object.values(error.errors).map((val) => val.message)
        });
      }
      res.status(500).json({
        success: false,
        message: "Server error while updating student"
      });
    }
  }
);

// Change student password
Adminrouter.put(
  "/students-update-password/:id",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: "New password is required"
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters"
        });
      }

      if (!/\d/.test(newPassword) || !/[!@#$%^&*]/.test(newPassword)) {
        return res.status(400).json({
          success: false,
          message: "Password must contain a number and a special character"
        });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      const updatedStudent = await Student.findByIdAndUpdate(
        req.params.id,
        {
          password: hashedPassword,
          password_changed_at: Date.now()
        },
        { new: true }
      ).select("-password -__v");

      if (!updatedStudent) {
        return res.status(404).json({
          success: false,
          message: "Student not found"
        });
      }

      res.json({
        success: true,
        message: "Student password updated successfully",
        data: updatedStudent
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while updating password"
      });
    }
  }
);

// Change student status (active/inactive)
Adminrouter.put(
  "/students-status/:id",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const { is_active } = req.body;

      if (typeof is_active !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "is_active must be a boolean value"
        });
      }

      const updatedStudent = await Student.findByIdAndUpdate(
        req.params.id,
        {
          is_active,
          last_login: is_active ? Date.now() : undefined
        },
        { new: true }
      ).select("-password -__v");

      if (!updatedStudent) {
        return res.status(404).json({
          success: false,
          message: "Student not found"
        });
      }

      res.json({
        success: true,
        message: `Student status changed to ${
          is_active ? "active" : "inactive"
        }`,
        data: updatedStudent
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while updating student status"
      });
    }
  }
);

// Delete single student
Adminrouter.delete(
  "/students/:id",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const deletedStudent = await Student.findByIdAndDelete(req.params.id);

      if (!deletedStudent) {
        return res.status(404).json({
          success: false,
          message: "Student not found"
        });
      }

      res.json({
        success: true,
        message: "Student deleted successfully"
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while deleting student"
      });
    }
  }
);

// Delete multiple students
Adminrouter.delete(
  "/delete-all-students",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const { studentIds } = req.body;

      if (
        !studentIds ||
        !Array.isArray(studentIds) ||
        studentIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide an array of student IDs to delete"
        });
      }

      const result = await Student.deleteMany({ _id: { $in: studentIds } });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "No students found to delete"
        });
      }

      res.json({
        success: true,
        message: `${result.deletedCount} student(s) deleted successfully`
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while deleting students"
      });
    }
  }
);

// -------------------------------------courses-routes----------------------------------------

// Create a new course
Adminrouter.post(
  "/courses",
  [
    authenticateToken,
    authorizeSubAdmin,
    upload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "attachments", maxCount: 10 },
      { name: "contentThumbnails", maxCount: 10 },
      { name: "contentVideos", maxCount: 1000 }
    ])
  ],
  async (req, res) => {
    try {
      const {
        title,
        description,
        type,
        price,
        content,
        level = "beginner",
        categories
      } = req.body;

      // Validate required fields
      if (!title || !description || !type || !content) {
        return res.status(400).json({
          success: false,
          message: "Title, description, type, and content are required"
        });
      }

      if (type === "premium" && (!price || isNaN(price))) {
        return res.status(400).json({
          success: false,
          message: "Price is required for premium courses"
        });
      }

      // Handle thumbnail upload
      if (!req.files?.thumbnail) {
        return res.status(400).json({
          success: false,
          message: "Course thumbnail is required"
        });
      }

      const thumbnailFile = req.files.thumbnail[0];
      const thumbnailData = {
        filename: thumbnailFile.originalname,
        path: thumbnailFile.filename,
        size: thumbnailFile.size,
        mimetype: thumbnailFile.mimetype
      };

      // Parse and process content
      let parsedContent =
        typeof content === "string" ? JSON.parse(content) : content;

      if (Array.isArray(parsedContent)) {
        parsedContent = parsedContent.map((item) => {
          // Handle tutorial content for premium courses
          if (item.type === "tutorial" && type === "premium") {
            const videoFile = req.files.contentVideos?.find(
              (f) => f.originalname === item.content?.name
            );
            if (videoFile) {
              item.content = {
                filename: videoFile.originalname,
                path: videoFile.filename,
                size: videoFile.size,
                mimetype: videoFile.mimetype
              };
            }
            // Ensure youtubeLink is removed for premium courses
            if (item.youtubeLink) {
              delete item.youtubeLink;
            }
            // In your POST /courses route handler:
            // In your POST /courses route handler:
            if (item.type === "live" && item.schedule) {
              const isValidFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(
                item.schedule
              );
              if (!isValidFormat) {
                throw new Error(
                  "Invalid schedule format. Use yyyy-MM-ddTHH:mm"
                );
              }
            }
          }

          // Handle tutorial content for free courses
          if (item.type === "tutorial" && type === "free") {
            // Ensure content is removed for free courses
            if (item.content) {
              delete item.content;
            }
          }

          // Handle live class thumbnails
          if (item.type === "live" && req.files.contentThumbnails) {
            const thumbFile = req.files.contentThumbnails.find(
              (f) => f.originalname === item.thumbnail?.name
            );
            if (thumbFile) {
              item.thumbnail = {
                filename: thumbFile.originalname,
                path: thumbFile.filename,
                size: thumbFile.size,
                mimetype: thumbFile.mimetype
              };
            }
          }

          return item;
        });
      }

      // Handle attachments
      const attachments =
        req.files.attachments?.map((file) => ({
          filename: file.originalname,
          path: file.filename,
          size: file.size,
          mimetype: file.mimetype
        })) || [];

      // Parse categories
      let categoryList = [];
      if (categories) {
        try {
          categoryList = JSON.parse(categories);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: "Invalid categories format"
          });
        }
      }

      // Create the course
      const newCourse = new Course({
        title,
        description,
        instructor: req.user_id,
        thumbnail: thumbnailData,
        type,
        price: type === "premium" ? parseFloat(price) : 0,
        content: parsedContent,
        attachments,
        level,
        status: "active",
        categories: categoryList
      });

      await newCourse.save();

      res.status(201).json({
        success: true,
        message: "Course created successfully",
        data: newCourse
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while creating course"
      });
    }
  }
);

// Get all courses
Adminrouter.get(
  "/courses",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const { status, type, instructor } = req.query;
      const filter = {};

      if (status) filter.status = status;
      if (type) filter.type = type;
      if (instructor) filter.instructor = instructor;

      const courses = await Course.find().sort({ createdAt: -1 });

      res.json({
        success: true,
        count: courses.length,
        data: courses
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching courses"
      });
    }
  }
);

// Get single course by ID
Adminrouter.get(
  "/courses/:id",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id)
        .populate("instructor", "name email")
        .populate("studentsEnrolled", "name email");

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      res.json({
        success: true,
        data: course
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching course"
      });
    }
  }
);

// Update course
Adminrouter.put(
  "/courses/:id",
  [
    authenticateToken,
    authorizeSubAdmin,
    upload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "attachments", maxCount: 10 },
      { name: "contentThumbnails", maxCount: 10 },
      { name: "contentVideos", maxCount: 10 } // Reduced from 1000 to 10
    ])
  ],
  async (req, res) => {
    try {
      const {
        title,
        description,
        type,
        price,
        content,
        categories,
        level,
        status,
        existingAttachments = "[]"
      } = req.body;

      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      // Handle thumbnail update
      if (req.files?.thumbnail) {
        const thumbnailFile = req.files.thumbnail[0];
        course.thumbnail = {
          filename: thumbnailFile.originalname,
          path: thumbnailFile.filename,
          size: thumbnailFile.size,
          mimetype: thumbnailFile.mimetype
        };
      }

      // Handle attachments - parse existing and merge with new ones
      let existingAttachmentsArray = [];
      try {
        existingAttachmentsArray = JSON.parse(existingAttachments);
      } catch (e) {
        console.error("Error parsing existingAttachments", e);
      }

      const newAttachments =
        req.files.attachments?.map((file) => ({
          filename: file.originalname,
          path: file.filename,
          size: file.size,
          mimetype: file.mimetype
        })) || [];

      course.attachments = [...existingAttachmentsArray, ...newAttachments];

      // Parse and process content
      let parsedContent =
        typeof content === "string" ? JSON.parse(content) : content;

      if (Array.isArray(parsedContent)) {
        // Track video content items that need processing
        const videoContentItems = parsedContent.filter(
          (item) =>
            item.type === "tutorial" &&
            type === "premium" &&
            (item.contentFile || item.content) // Include existing content
        );

        // Assign videos in order
        const videoFiles = req.files?.contentVideos || [];
        let videoIndex = 0;

        parsedContent = parsedContent.map((item) => {
          // Handle tutorial content for premium courses
          if (item.type === "tutorial" && type === "premium") {
            // Handle new video upload
            if (item.contentFile && videoFiles[videoIndex]) {
              item.content = {
                filename: videoFiles[videoIndex].originalname,
                path: videoFiles[videoIndex].filename,
                size: videoFiles[videoIndex].size,
                mimetype: videoFiles[videoIndex].mimetype
              };
              videoIndex++;
            } else if (item.content && !item.contentFile) {
              // Keep existing content if no new file was uploaded
              item.content = item.content;
            }

            // Clean up temporary field
            delete item.contentFile;
            delete item.youtubeLink;
          }

          // Handle tutorial content for free courses
          if (item.type === "tutorial" && type === "free") {
            // Ensure content is removed for free courses
            if (item.content) {
              delete item.content;
            }
          }

          // Handle live class thumbnails
          if (item.type === "live" && req.files.contentThumbnails) {
            const thumbFile = req.files.contentThumbnails.find(
              (f) => f.originalname === item.thumbnail?.name
            );
            if (thumbFile) {
              item.thumbnail = {
                filename: thumbFile.originalname,
                path: thumbFile.filename,
                size: thumbFile.size,
                mimetype: thumbFile.mimetype
              };
            }
          }

          return item;
        });

        // Verify all videos were assigned
        const expectedVideos = parsedContent.filter(
          (item) =>
            item.type === "tutorial" && type === "premium" && item.contentFile
        ).length;

        if (videoIndex < expectedVideos) {
          return res.status(400).json({
            success: false,
            message: `Missing video files for ${
              expectedVideos - videoIndex
            } tutorials`
          });
        }
      }

      // Update other fields
      if (title) course.title = title;
      if (description) course.description = description;
      if (type) course.type = type;
      if (price) course.price = parseFloat(price);
      if (content) course.content = parsedContent;
      if (categories) {
        course.categories =
          typeof categories === "string" ? JSON.parse(categories) : categories;
      }
      if (level) course.level = level;
      if (status) course.status = status;

      // Validate before saving
      if (course.type === "premium" && (!course.price || isNaN(course.price))) {
        return res.status(400).json({
          success: false,
          message: "Price is required for premium courses"
        });
      }

      // Validate content items
      for (const item of course.content) {
        if (item.type === "tutorial") {
          if (course.type === "free" && !item.youtubeLink) {
            return res.status(400).json({
              success: false,
              message: `YouTube link is required for free tutorial: ${item.title}`
            });
          }

          if (course.type === "premium" && !item.content) {
            return res.status(400).json({
              success: false,
              message: `Video content is required for premium tutorial: ${item.title}`
            });
          }
        }

        if (item.type === "live" && !item.meetingLink) {
          return res.status(400).json({
            success: false,
            message: `Meeting link is required for live class: ${item.title}`
          });
        }
      }

      await course.save();

      res.json({
        success: true,
        message: "Course updated successfully",
        data: course
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: error.message || "Server error while updating course"
      });
    }
  }
);

// Change course status
Adminrouter.put(
  "/courses/:id/status",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value"
        });
      }

      const course = await Course.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      res.json({
        success: true,
        message: `Course status changed to ${status}`,
        data: course
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while updating course status"
      });
    }
  }
);

// Delete course
Adminrouter.delete(
  "/courses/:id",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const course = await Course.findByIdAndDelete(req.params.id);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      // TODO: Delete associated files from storage

      res.json({
        success: true,
        message: "Course deleted successfully"
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while deleting course"
      });
    }
  }
);

// Get course analytics
Adminrouter.get(
  "/courses/:id/analytics",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id)
        .populate("studentsEnrolled", "name email")
        .populate("ratings.user", "name");

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      const analytics = {
        totalStudents: course.studentsEnrolled.length,
        averageRating: course.averageRating,
        totalRatings: course.ratings.length,
        ratingDistribution: [1, 2, 3, 4, 5].map((star) => ({
          star,
          count: course.ratings.filter((r) => r.rating === star).length
        })),
        recentStudents: course.studentsEnrolled.slice(0, 5),
        recentReviews: course.ratings
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map((r) => ({
            user: r.user,
            rating: r.rating,
            review: r.review,
            date: r.createdAt
          }))
      };

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching course analytics"
      });
    }
  }
);

// Get all courses by status
Adminrouter.get(
  "/courses/status/:status",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const { status } = req.params;

      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value"
        });
      }

      const courses = await Course.find({ status })
        .populate("instructor", "name email")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: courses.length,
        data: courses
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching courses by status"
      });
    }
  }
);

// Publish course (change status from to active)
Adminrouter.put(
  "/courses/:id/publish",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      course.status = "active";
      await course.save();

      res.json({
        success: true,
        message: "Course published successfully",
        data: course
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while publishing course"
      });
    }
  }
);

// Unpublish course (change status to inactive)
Adminrouter.put(
  "/courses/:id/unpublish",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      if (course.status !== "active") {
        return res.status(400).json({
          success: false,
          message: "Only active courses can be unpublished"
        });
      }

      course.status = "inactive";
      await course.save();

      res.json({
        success: true,
        message: "Course unpublished successfully",
        data: course
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error while unpublishing course"
      });
    }
  }
);
// Reassign course to a new teacher (admin only)
Adminrouter.put(
  "/reassign-teacher/:courseId",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const { courseId, newInstructorId, changedBy } = req.params;

      if (!newInstructorId) {
        return res.json({
          success: false,
          message: "New instructor ID is required"
        });
      }
      const course = await Course.findById(courseId);
      if (!course) {
        return res.json({ success: false, message: "Course not found" });
      }

      if (course.instructor) {
        course.previousInstructors.push({
          instructor: course.instructor,
          changedAt: new Date(),
          changedBy: changedBy
        });
      }

      // Update the instructor
      course.instructor = newInstructorId;
      await course.save();

      res.json({
        success: true,
        message: "Course instructor updated successfully"
      });
    } catch (error) {
      console.error("Error reassigning teacher:", error);
      res
        .status(500)
        .json({ message: "Server error while reassigning teacher" });
    }
  }
);

// Change course instructor (admin only)
Adminrouter.put(
  "/courses/:courseId/change-instructor",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      console.log(req.params);
      const { courseId } = req.params;
      const { newInstructorId, changedBy } = req.body;

      // Validate required fields
      if (!newInstructorId || !changedBy) {
        return res.status(400).json({
          success: false,
          message: "Both newInstructorId and changedBy are required"
        });
      }

      // Find the course
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      // Verify the new instructor exists (optional - remove if not needed)
      const newInstructor = await Teacher.findById(newInstructorId);
      if (!newInstructor) {
        return res.status(404).json({
          success: false,
          message: "New instructor not found"
        });
      }

      // Verify the admin making the change exists (optional)
      const adminMakingChange = await Admin.findById(changedBy);
      if (!adminMakingChange) {
        return res.status(404).json({
          success: false,
          message: "Admin making the change not found"
        });
      }

      // If there's a current instructor, add to previous instructors
      if (course.instructor) {
        course.previousInstructors.push({
          instructor: course.instructor,
          changedAt: new Date(),
          changedBy: changedBy
        });
      }

      // Update the instructor
      course.instructor = newInstructorId;
      await course.save();

      res.json({
        success: true,
        message: "Course instructor updated successfully",
        data: {
          courseId: course._id,
          newInstructor: newInstructorId,
          previousInstructor: course.instructor,
          changedBy: changedBy,
          changedAt: new Date()
        }
      });
    } catch (error) {
      console.error("Error changing course instructor:", error);
      res.status(500).json({
        success: false,
        message: "Server error while changing course instructor",
        error: error.message
      });
    }
  }
);
// ------------------------------------courses-routes-------------------------------------------------

// ---------------------------all-category----------------------------
Adminrouter.get(
  "/all-category",
  authenticateToken,
  authorizeSubAdmin,
  async (req, res) => {
    try {
      const allcategory = await Category.find();
      if (!allcategory) {
        return res.send({ success: false, message: "Category did not find!" });
      }
      res.send({ success: true, data: allcategory });
    } catch (error) {
      console.log(error);
    }
  }
);
module.exports = Adminrouter;
