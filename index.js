import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import cookieParser from "cookie-parser";
import nodemailer from "nodemailer";
import middleware from "./middleware.js";

configDotenv();

import MERNAuth from "./model.js";

const app = express();

mongoose
  .connect(process.env.URL)
  .then(() => {
    try {
      app.listen(3000, () => {
        console.log("Connection Established on port:", 3000);
      });
    } catch (err) {
      console.log(err.message);
    }
  })
  .catch((err) => console.log(err, "Database Denied"));

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kondapalliharshavardhanraju@gmail.com",
    pass: "sccpexdptyftqppp",
  },
});

app.disable("x-powered-by");
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cookieParser());

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const exist = await MERNAuth.findOne({ email });
    if (exist) {
      return res.status(400).json({ message: "user already exist." });
    }
    const hash = await bcrypt.hash(password, 10);

    const user = new MERNAuth({ username, email, password: hash });
    await user.save();
    res.status(200).json({ message: "User Registered Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server error!" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await MERNAuth.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password!" });
    }

    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
    });

    res.status(200).send({ message: "Cookie Set Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server error!" });
  }
});

app.get("/my-profile", middleware, async (req, res) => {
  try {
    const id = req.user.id;
    const user = await MERNAuth.findById({ _id: id });

    if (!user) {
      res.status(400).send({ message: "User doesnot exist" });
    }
    res.status(200).json({ user });
  } catch (err) {
    console.log(err);
  }
});

app.get("/logout", (req, res) => {
  try {
    //check if the cookie existed or not
    if (typeof req.cookies.token === "string") {
      res.clearCookie("token", { path: "/" });
      res.status(200).send({ message: "Logged out Successfully" });
    } else {
      res.status(400).send({ message: "No Cookie Found!" });
    }
  } catch (err) {
    console.log(err);
  }
});

app.put("/getotp", async (req, res) => {
  let { email } = req.body;

  try {
    const user = await MERNAuth.findOne({ email });

    if (!user) {
      return res.status(400).send({ message: "User does not exist!" });
    }

    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < 4; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }

    let now = new Date();

    let otpExpiry = now.getTime() + 60 * 1000 * 5;

    user.otp = otp;
    user.otpExpiration = otpExpiry;
    await user.save();

    let mailOptions = {
      from: "kondapalliharshavardhanraju@gmail.com",
      to: email,
      subject: "OTP for Login",
      text: `Your OTP is ${otp}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        res.status(501).send("sending email failed");
      } else {
        res.status(200).send({ message: "OTP sent to your email" });
      }
    });
  } catch (err) {
    console.log(err);
  }
});

app.post("/verifyotp", async (req, res) => {
  let { email, otp } = req.body;

  try {
    let now = new Date();
    let otpExpiry = now.getTime();
    let user = await MERNAuth.findOne({ email });
    if (!user) {
      return res.status(400).send({ message: "User doesnot exist!" });
    }
    if (!user.otp){
        return res.status(400).send({ message: "OTP Not Requested!" });
    }
    if (user.otpExpiration < otpExpiry) {
      return res.status(400).send({ message: "OTP expired!" });
    }
    if (user.otp != otp) {
      return res.status(400).send({ message: "Invalid OTP!" });
    }
    user.otp = null;
    user.otpExpiration = null;
    user.save();
    res.send({ message: "OTP verified!", userId: user._id });
  } catch (err) {
    console.log(err);
  }
});

app.put("/reset-password/:userId", async (req, res) => {
  let { password } = req.body;
  let { userId } = req.params;

  try {
    let user = await MERNAuth.findById( userId );
    if (!user) {
      return res.status(400).send({ message: "User does not exist!" });
    }
    const hash = await bcrypt.hash(password, 10)
    user.password = hash;
    await user.save();
    res.send({ message: "Password reset successfully!" });
  } catch (err) {
    console.log(err);
  }
});

app.get("/", (req, res) => {
  res.send("<h1>Hello world<h1>");
});
