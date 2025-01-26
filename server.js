const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect("mongodb+srv://abdi:dDOzsHAHtK2VYtnd@cluster0.x0kkc.mongodb.net/hackathon");


const db = mongoose.connection;
db.once("open", () => console.log("MongoDB connected"));

// User Schema
const userSchema = new mongoose.Schema({
  email: String,
  username: String,
  cnic: String,
  password: String, // Hashed password
});

const User = mongoose.model("User", userSchema);

// Loan Schema
const loanSchema = new mongoose.Schema({
  loanDetails: Object,
  userId: mongoose.Schema.Types.ObjectId,
});

const Loan = mongoose.model("Loan", loanSchema);

// Generate Random Password
const generateRandomPassword = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return password;
};

// Registration Endpoint
app.post("/api/submit-loan", async (req, res) => {
  const { loanDetails, userDetails } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userDetails.email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate random password and hash it
    const randomPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Save user details with hashed password
    const user = new User({
      email: userDetails.email,
      username: userDetails.username,
      cnic: userDetails.cnic,
      password: hashedPassword,
    });
    const savedUser = await user.save();

    // Save loan details associated with the user
    const loan = new Loan({
      loanDetails,
      userId: savedUser._id,
    });
    await loan.save();

    // Return random password to the user (this should be emailed in a real app)
    res.status(200).json({
      message: "User registered successfully",
      randomPassword, // Share the password with the client
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login Endpoint
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.status(200).json({ message: "Login successful", userId: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Start Server
app.listen(8000, () => console.log("Server running on http://localhost:8000"));