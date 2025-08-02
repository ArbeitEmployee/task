const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Order = require("./Order"); // Adjust path as needed
const studentSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email"
      ]
    },
    password: {
      type: String,
      required: true,
      minlength: [6, "Password must be at least 6 characters"],
      select: false
    },
    full_name: {
      type: String,
      required: [true, "Please enter your full name"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"]
    },
    phone: {
      type: String,
      required: [true, "Please enter your phone number"]
    },
    date_of_birth: {
      type: String,
      match: [
        /^\d{4}-\d{2}-\d{2}$/,
        "Date of birth must be in YYYY-MM-DD format"
      ]
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"]
    },
    profile_picture: {
      type: String
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      default: "student",
      enum: ["student", "admin", "instructor"]
    },
    otp: {
      type: String
    },
    otpExpires: {
      type: Date
    },
    resetPasswordToken: {
      type: String
    },
    resetPasswordExpire: {
      type: Date
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date
    },
    enrolledCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          required: true
        },
        enrolledAt: {
          type: Date,
          default: Date.now
        },
        progress: {
          type: Number,
          default: 0,
          min: 0,
          max: 100
        },
        completed: {
          type: Boolean,
          default: false
        },
        lastAccessed: {
          type: Date
        },
        // Track quiz attempts
        quizAttempts: [
          {
            contentItemId: {
              type: mongoose.Schema.Types.ObjectId,
              required: true
            },
            attemptDate: {
              type: Date,
              default: Date.now
            },
            score: {
              type: Number,
              min: 0,
              max: 100
            },
            answers: [
              {
                questionId: mongoose.Schema.Types.ObjectId,
                answer: mongoose.Schema.Types.Mixed,
                isCorrect: Boolean
              }
            ],
            passed: Boolean
          }
        ],
        // Track completion of individual content items
        contentProgress: [
          {
            contentItemId: {
              type: mongoose.Schema.Types.ObjectId,
              required: true
            },
            completed: {
              type: Boolean,
              default: false
            },
            lastAccessed: Date,
            completedAt: Date
          }
        ],
        certificates: [
          {
            url: String,
            issuedAt: Date,
            expiresAt: Date
          }
        ]
      }
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
      }
    ],
    cart: {
      items: [
        {
          courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true
          },
          addedAt: {
            type: Date,
            default: Date.now
          },
          price: {
            type: Number,
            required: true
          }
        }
      ],
      total: {
        type: Number,
        default: 0
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    },
    learningGoals: {
      type: String,
      maxlength: [500, "Learning goals cannot exceed 500 characters"]
    },
    education: [
      {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        startYear: Number,
        endYear: Number
      }
    ],
    skills: [String],
    preferences: {
      notificationEnabled: {
        type: Boolean,
        default: true
      },
      darkMode: {
        type: Boolean,
        default: false
      },
      language: {
        type: String,
        default: "english"
      }
    },
    paymentMethods: [
      {
        type: {
          type: String,
          enum: ["credit_card", "debit_card", "paypal", "bank_transfer"],
          required: true
        },
        details: {
          // Generic field that can store different payment method details
          type: mongoose.Schema.Types.Mixed
        },
        isDefault: {
          type: Boolean,
          default: false
        },
        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    orders: [
      {
        orderId: {
          type: String,
          required: true
        },
        courses: [
          {
            courseId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Course",
              required: true
            },
            price: {
              type: Number,
              required: true
            }
          }
        ],
        totalAmount: {
          type: Number,
          required: true
        },
        paymentMethod: {
          type: String,
          required: true
        },
        status: {
          type: String,
          enum: ["pending", "completed", "failed", "refunded"],
          default: "pending"
        },
        transactionId: String,
        purchasedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtuals
studentSchema.virtual("isLocked").get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

studentSchema.virtual("enrolledCoursesCount").get(function () {
  return this.enrolledCourses.length;
});

studentSchema.virtual("cartItemCount").get(function () {
  return this.cart.items.length;
});
// Middleware
studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Methods
studentSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

studentSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

  return resetToken;
};

studentSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

studentSchema.methods.incrementLoginAttempts = function () {
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_TIME = 30 * 60 * 1000; // 30 minutes

  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  return this.updateOne(updates);
};

// Enrollment Methods
studentSchema.methods.enrollCourse = async function (courseId) {
  const isEnrolled = this.enrolledCourses.some(
    (c) => c.course.toString() === courseId.toString()
  );

  if (isEnrolled) {
    throw new Error("You are already enrolled in this course");
  }

  this.enrolledCourses.push({
    course: courseId,
    progress: 0,
    completed: false
  });

  await this.save();
  return this;
};

studentSchema.methods.updateCourseProgress = async function (
  courseId,
  progress
) {
  const enrollment = this.enrolledCourses.find(
    (c) => c.course.toString() === courseId.toString()
  );

  if (!enrollment) {
    throw new Error("You are not enrolled in this course");
  }

  enrollment.progress = Math.min(progress, 100);
  enrollment.lastAccessed = Date.now();

  if (progress >= 100) {
    enrollment.completed = true;
  }

  await this.save();
  return this;
};

// Quiz Methods
studentSchema.methods.recordQuizAttempt = async function (
  courseId,
  contentItemId,
  answers,
  score,
  passed
) {
  const enrollment = this.enrolledCourses.find(
    (e) => e.course.toString() === courseId.toString()
  );

  if (!enrollment) {
    throw new Error("You are not enrolled in this course");
  }

  // Record the quiz attempt
  enrollment.quizAttempts.push({
    contentItemId,
    score,
    answers,
    passed
  });

  // Update content progress
  let contentProgress = enrollment.contentProgress.find(
    (cp) => cp.contentItemId.toString() === contentItemId.toString()
  );

  if (!contentProgress) {
    contentProgress = {
      contentItemId,
      completed: passed,
      lastAccessed: new Date()
    };
    if (passed) {
      contentProgress.completedAt = new Date();
    }
    enrollment.contentProgress.push(contentProgress);
  } else {
    contentProgress.lastAccessed = new Date();
    if (passed && !contentProgress.completed) {
      contentProgress.completed = true;
      contentProgress.completedAt = new Date();
    }
  }

  // Update overall course progress
  const completedContentCount = enrollment.contentProgress.filter(
    (cp) => cp.completed
  ).length;
  const totalContentCount = await this.constructor.getCourseContentCount(
    courseId
  );
  const newProgress = Math.floor(
    (completedContentCount / totalContentCount) * 100
  );

  if (newProgress > enrollment.progress) {
    enrollment.progress = newProgress;
    if (newProgress >= 100) {
      enrollment.completed = true;
    }
  }

  await this.save();
  return this;
};

// Static method to get course content count
studentSchema.statics.getCourseContentCount = async function (courseId) {
  const course = await mongoose
    .model("Course")
    .findById(courseId)
    .select("content");
  return course ? course.content.length : 0;
};

studentSchema.methods.addToWishlist = async function (courseId) {
  if (this.wishlist.includes(courseId)) {
    throw new Error("Course already in wishlist");
  }

  this.wishlist.push(courseId);
  await this.save();
  return this;
};

studentSchema.methods.removeFromWishlist = async function (courseId) {
  this.wishlist = this.wishlist.filter(
    (id) => id.toString() !== courseId.toString()
  );
  await this.save();
  return this;
};
// Cart Methods
studentSchema.methods.addToCart = async function (courseId, price) {
  const existingItem = this.cart.items.find(
    (item) => item.courseId.toString() === courseId.toString()
  );

  if (existingItem) {
    throw new Error("Course already in cart");
  }

  this.cart.items.push({
    courseId,
    price
  });

  // Recalculate total
  this.cart.total = this.cart.items.reduce(
    (total, item) => total + item.price,
    0
  );
  this.cart.lastUpdated = new Date();

  await this.save();
  return this.cart;
};
studentSchema.methods.removeFromCart = async function (courseId) {
  // Convert courseId to ObjectId if it's a string
  const courseObjectId = new mongoose.Types.ObjectId(courseId);

  // Filter out the item
  this.cart.items = this.cart.items.filter(
    (item) => !item.courseId.equals(courseObjectId)
  );

  // Mark the array as modified
  this.markModified("cart.items");

  // Save with validation disabled
  await this.save({ validateBeforeSave: false });
};

studentSchema.methods.clearCart = async function () {
  this.cart = {
    items: [],
    total: 0,
    lastUpdated: new Date()
  };

  await this.save();
  return this.cart;
};
studentSchema.methods.checkoutCart = async function (
  paymentMethod,
  cardDetails
) {
  // Validate payment method
  if (!paymentMethod) {
    throw new Error("Payment method not found");
  }

  // Process payment based on method
  if (paymentMethod === "card") {
    if (
      !cardDetails ||
      !cardDetails.number ||
      !cardDetails.expiry ||
      !cardDetails.cvc
    ) {
      throw new Error("Invalid card details");
    }
    // Mock payment processing
    const paymentSuccess = true;
    if (!paymentSuccess) {
      throw new Error("Payment processing failed");
    }
  }

  // Validate all course references before proceeding
  const invalidCourses = this.cart.items.filter(
    (item) => !mongoose.Types.ObjectId.isValid(item.courseId)
  );

  if (invalidCourses.length > 0) {
    throw new Error(
      `Invalid course references: ${invalidCourses
        .map((c) => c.courseId)
        .join(", ")}`
    );
  }

  // Create order
  const order = new Order({
    student: this._id,
    courses: this.cart.items.map((item) => ({
      course: item.courseId,
      price: item.price
    })),
    total: this.cart.total,
    paymentMethod
  });

  // Clear existing invalid enrolledCourses references if any
  this.enrolledCourses = this.enrolledCourses.filter(
    (ec) => ec.course && mongoose.Types.ObjectId.isValid(ec.course)
  );

  // Add new courses to enrolledCourses
  this.cart.items.forEach((item) => {
    // Only add if not already enrolled
    if (!this.enrolledCourses.some((ec) => ec.course.equals(item.courseId))) {
      this.enrolledCourses.push({
        course: item.courseId,
        enrolledAt: Date.now()
      });
    }
  });

  // Clear cart
  this.cart = { items: [], total: 0 };

  try {
    await this.save();
    await order.save();
    return order;
  } catch (saveError) {
    console.error("Save error:", saveError);
    throw new Error("Failed to save enrollment and order");
  }
};

// Payment Methods
studentSchema.methods.addPaymentMethod = async function (
  type,
  details,
  isDefault = false
) {
  // If setting as default, first unset any existing default
  if (isDefault) {
    this.paymentMethods.forEach((method) => {
      method.isDefault = false;
    });
  }

  this.paymentMethods.push({
    type,
    details,
    isDefault
  });

  await this.save();
  return this.paymentMethods;
};

studentSchema.methods.removePaymentMethod = async function (paymentMethodId) {
  this.paymentMethods = this.paymentMethods.filter(
    (method) => method._id.toString() !== paymentMethodId.toString()
  );

  await this.save();
  return this.paymentMethods;
};

studentSchema.methods.setDefaultPaymentMethod = async function (
  paymentMethodId
) {
  // First unset any existing default
  this.paymentMethods.forEach((method) => {
    method.isDefault = false;
  });

  // Set the new default
  const method = this.paymentMethods.id(paymentMethodId);
  if (method) {
    method.isDefault = true;
  }

  await this.save();
  return this.paymentMethods;
};
const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
