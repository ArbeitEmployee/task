const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/employeeAuth");
const {
  getMe,
  updateProfile,
  changePassword
} = require("../controllers/employeeController");
const Employee = require("../models/Employee");
const Consultation = require("../models/Consultation");
const VisaRequest = require("../models/VisaRequest");
const path = require("path");
const fs = require("fs");
const uploads = require("../utils/upload");
// ------------------login-----------------------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if employee exists
    const employee = await Employee.findOne({ email }).select("+password");
    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check password
    const isMatch = await employee.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
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
        phoneNumber: employee.phoneNumber
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});

// Protected routes
router.use(authenticateToken);
//---------------------- Consultancy--------------------------------
router.get("/me", getMe);
router.put("/update-profile", updateProfile);
router.put("/change-password", changePassword);
router.get("/consultations", async (req, res) => {
  try {
    // Only consultants can access their assigned consultations
    if (req.user.role !== "consultant") {
      return res.status(403).json({
        success: false,
        message: "Only consultants can access assigned consultations"
      });
    }

    const consultations = await Consultation.find({
      assignedTo: req.user.id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: consultations.length,
      data: consultations
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});

// Cancel consultation with reason (employee route)
router.put("/consultations/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    if (!cancellationReason) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required"
      });
    }

    // Check if consultation exists and is assigned to this employee
    const consultation = await Consultation.findOne({
      _id: req.params.id,
      assignedTo: req.user.id
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found or not assigned to you"
      });
    }

    // Update status and reason
    consultation.status = "cancelled";
    consultation.cancellationReason = cancellationReason;
    await consultation.save();

    res.status(200).json({
      success: true,
      data: consultation
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});

// Complete consultation (employee route)
router.put(
  "/consultations/:id/complete",
  authenticateToken,
  async (req, res) => {
    try {
      // Check if consultation exists and is assigned to this employee
      const consultation = await Consultation.findOne({
        _id: req.params.id,
        assignedTo: req.user.id
      });

      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: "Consultation not found or not assigned to you"
        });
      }

      // Update status
      consultation.status = "completed";
      await consultation.save();

      res.status(200).json({
        success: true,
        data: consultation
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        success: false,
        message: "Server Error"
      });
    }
  }
);
//-----------------Visa Processing------------------------------------
router.get("/assigned", authenticateToken, async (req, res) => {
  try {
    // In your route handler
    const requests = await VisaRequest.find({
      assignedConsultant: req.user.id
    })
      .populate({
        path: "student",
        select: "full_name email" // Explicitly select required fields
      })
      .populate("assignedConsultant", "username email phoneNumber");
    res.json({
      success: true,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Employee approves document
router.put(
  "/approve-document/:requestId",
  authenticateToken,
  async (req, res) => {
    try {
      const { documentName } = req.body;

      const visaRequest = await VisaRequest.findOne({
        _id: req.params.requestId,
        assignedConsultant: req.user.id
      });

      if (!visaRequest) {
        return res.status(404).json({
          success: false,
          message: "Visa request not found or not assigned to you"
        });
      }

      const documentIndex = visaRequest.documents.findIndex(
        (doc) => doc.name === documentName
      );

      if (documentIndex === -1) {
        return res.status(400).json({
          success: false,
          message: "Document not found in request"
        });
      }

      visaRequest.documents[documentIndex].status = "approved";
      await visaRequest.save();

      res.json({
        success: true,
        updatedRequest: visaRequest
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Employee rejects document
router.put(
  "/reject-document/:requestId",
  authenticateToken,
  async (req, res) => {
    try {
      const { documentName, feedback } = req.body;

      const visaRequest = await VisaRequest.findOne({
        _id: req.params.requestId,
        assignedConsultant: req.user.id
      });

      if (!visaRequest) {
        return res.status(404).json({
          success: false,
          message: "Visa request not found or not assigned to you"
        });
      }

      const documentIndex = visaRequest.documents.findIndex(
        (doc) => doc.name === documentName
      );

      if (documentIndex === -1) {
        return res.status(400).json({
          success: false,
          message: "Document not found in request"
        });
      }

      visaRequest.documents[documentIndex].status = "rejected";
      visaRequest.documents[documentIndex].feedback = feedback;
      await visaRequest.save();

      res.json({
        success: true,
        updatedRequest: visaRequest
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Employee updates processing step
router.put("/update-step/:requestId", authenticateToken, async (req, res) => {
  try {
    const { stepName, status, notes } = req.body;

    const visaRequest = await VisaRequest.findOne({
      _id: req.params.requestId,
      assignedConsultant: req.user.id
    }).select("+processingSteps.status"); // Ensure status field is included

    if (!visaRequest) {
      return res.status(404).json({
        success: false,
        message: "Visa request not found or not assigned to you"
      });
    }

    const stepIndex = visaRequest.processingSteps.findIndex(
      (step) => step.name === stepName
    );

    if (stepIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Step not found in request"
      });
    }

    // Update step details
    visaRequest.processingSteps[stepIndex].status = status;
    visaRequest.processingSteps[stepIndex].notes = notes;

    if (status === "completed") {
      visaRequest.processingSteps[stepIndex].completedAt = new Date();

      // For all completed steps
      if (stepIndex < visaRequest.processingSteps.length - 1) {
        // Intermediate step completion
        visaRequest.currentStep = stepIndex + 1;

        // Add documents for next step
        const nextStep = visaRequest.processingSteps[stepIndex + 1];
        if (nextStep.requiredDocuments?.length > 0) {
          nextStep.requiredDocuments.forEach((docName) => {
            if (!visaRequest.documents.some((doc) => doc.name === docName)) {
              visaRequest.documents.push({
                name: docName,
                status: "pending"
              });
            }
          });
        }
      } else {
        // Final step completion - more explicit handling
        visaRequest.status = "completed";
        visaRequest.completedAt = new Date();
        visaRequest.currentStep = visaRequest.processingSteps.length; // Mark as fully complete
      }
    }

    await visaRequest.save();

    // Return the fully populated updated request
    const updatedRequest = await VisaRequest.findById(visaRequest._id)
      .populate("student", "full_name email")
      .populate("assignedConsultant", "username email");

    res.json({
      success: true,
      updatedRequest
    });
  } catch (error) {
    console.error("Error updating visa step:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update visa processing step"
    });
  }
});

router.post(
  "/upload/:requestId",
  authenticateToken,
  uploads.single("document"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      const visaRequest = await VisaRequest.findById(req.params.requestId);

      if (!visaRequest) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: "Visa request not found"
        });
      }

      const documentName = req.body.documentName;
      const documentIndex = visaRequest.documents.findIndex(
        (doc) => doc.name === documentName
      );

      if (documentIndex === -1) {
        // Remove the uploaded file if document name is invalid
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Invalid document name for this visa request"
        });
      }

      // If there was a previous file, delete it
      if (visaRequest.documents[documentIndex].url) {
        const oldFilePath = path.join(
          __dirname,
          "../",
          visaRequest.documents[documentIndex].url
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Update the document
      visaRequest.documents[documentIndex] = {
        name: documentName,
        url: req.file.path.replace(/\\/g, "/"), // Convert to forward slashes for consistency
        status: "pending", // Reset status when new file is uploaded
        feedback: "", // Clear any previous feedback
        uploadedAt: new Date()
      };

      await visaRequest.save();

      res.json({
        success: true,
        document: visaRequest.documents[documentIndex],
        message: "Document uploaded successfully"
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      // Clean up the uploaded file if there was an error
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        success: false,
        message: "Server error while uploading document"
      });
    }
  }
);

router.get("/download/:filename", authenticateToken, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "../public/visa", filename);

  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).send("Could not download file");
      }
    });
  } else {
    res.status(404).send("File not found");
  }
});
module.exports = router;
