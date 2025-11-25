// src/utils/sendEmail.js

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try{
         // 1. Create a Transporter
    // This defines the connection details for the email service
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT === 465, // true for 465, false for other ports like 587
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    // 2. Define Email Options
    const mailOptions = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`, // Sender address
        to: options.email, // Recipient email (from your controller)
        subject: options.subject, // Subject line (from your controller)
        text: options.message, // Plain text body (from your controller)
        // html: options.htmlMessage, // Optional: HTML body for a nicer email template
    };

    // 3. Send the Email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully! Message ID: %s", info);

    } catch (error) {
    
        console.error("Failed to send email:", error); 
        
        throw error; 
    }
   
};

module.exports = sendEmail;