import mongoose from "mongoose";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '1h' // Optional: Automatically remove the token after 1 hour
  }
});

const MERNAuthSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [emailRegex, "Please enter a valid email address"]
  },
  password: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: false,
  },
  otpExpiration: {
    type: Number,
    required: false,
  },
  tokens: [tokenSchema] // Array of token objects
});

export default mongoose.model("MERNAuth", MERNAuthSchema);
