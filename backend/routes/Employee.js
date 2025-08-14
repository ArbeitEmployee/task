const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/employeeAuth");
const {
  getMe,
  updateProfile,
  changePassword,
} = require("../controllers/employeeController");
const Employee = require("../models/Employee");
const Consultation = require("../models/Consultation");
// @route   POST /api/employee/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if employee exists
    const employee = await Employee.findOne({ email }).select("+password");
    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await employee.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Create token
    const token = employee.generateAuthToken();

    res.status(200).json({
      success: true,
      token,
      employee: {
        id: employee._id,
        username: employee.username,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// Protected routes
router.use(authenticateToken);

router.get("/me", getMe);
router.put("/update-profile", updateProfile);
router.put("/change-password", changePassword);
router.get("/consultations", async (req, res) => {
  try {
    // Only consultants can access their assigned consultations
    if (req.user.role !== "consultant") {
      return res.status(403).json({
        success: false,
        message: "Only consultants can access assigned consultations",
      });
    }

    const consultations = await Consultation.find({
      assignedTo: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: consultations.length,
      data: consultations,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

router.put("/consultations/:id/status", async (req, res) => {
  try {
    // Only consultants can update consultation status
    if (req.user.role !== "consultant") {
      return res.status(403).json({
        success: false,
        message: "Only consultants can update consultation status",
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Check if consultation exists and is assigned to this employee
    const consultation = await Consultation.findOne({
      _id: id,
      assignedTo: req.user.id,
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found or not assigned to you",
      });
    }

    // Update status
    consultation.status = status;
    await consultation.save();

    res.status(200).json({
      success: true,
      data: consultation,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

module.exports = router;
