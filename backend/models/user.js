const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "instructor", "admin", "teaching-assistant"],
      default: "student"
    },
    avatar: String,
    bio: String,
    expertise: [String],
    socialLinks: {
      website: String,
      twitter: String,
      linkedin: String,
      github: String
    },
    isVerified: { type: Boolean, default: false },
    lastLogin: Date,
    status: {
      type: String,
      enum: ["active", "suspended", "deactivated"],
      default: "active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
