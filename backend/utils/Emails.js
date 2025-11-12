const nodemailer = require("nodemailer");
const { AppError } = require("../middleware/ErrorHandler");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

exports.sendMail = async(receiverEmail,subject,body) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL,
      to: receiverEmail,
      subject: subject,
      html: body
    });
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    throw new AppError('Failed to send email', 500, 'EXTERNAL_API_ERROR');
  }
};
