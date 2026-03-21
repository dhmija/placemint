const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: process.env.MAIL_PORT || 587,
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS, // Your Gmail App Password
      },
    });

    const info = await transporter.sendMail({
      from: `"Placement Portal" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });

    logger.info(`Email sent to ${to} with subject "${subject}" - MessageId: ${info.messageId}`);
  } catch (error) {
    logger.error(`Error sending email to ${to}: ${error.message}`);
    throw new Error('Failed to send email.');
  }
};

module.exports = sendEmail;