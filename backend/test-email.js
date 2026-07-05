require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("Testing email with user:", process.env.GMAIL_USER);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.log("Error verifying transporter:");
    console.error(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});
