import { transporter } from "../config/email.config.js";

export const sendVerificationOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const { otp } = req; // Get OTP from the request object

        console.log("Email:", process.env.NODEMAILER_EMAIL);
        console.log("Password:", process.env.NODEMAILER_PASS);


        // Prepare email content
        const response = await transporter.sendMail({
            from: `"SafarSathi" <${process.env.NODEMAILER_EMAIL}>`, // sender address
            to: email, // recipient's email
            subject: "Verify Your Email", // Subject line
            text: `Your OTP is: ${otp}`, // Plain text body
            html: Verification_Email_Template.replace("{verificationCode}",otp), // HTML body
        });

        console.log("Email Sent Successfully:", response);

        res.status(200).json({ message: "OTP sent successfully", otp: otp }); // Optional: include OTP for testing
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to send OTP" });
    }
};

export const sendWelcomeEmail=async(email,name)=>{
    try {
     const response=   await transporter.sendMail({
            from: `"SafarSathi" <${process.env.NODEMAILER_EMAIL}>`,

            to: email, // list of receivers
            subject: "Welcome Email", // Subject line
            text: "Welcome Email", // plain text body
            html: Welcome_Email_Template.replace("{name}",name)
        })
        console.log('Email send Successfully',response)
    } catch (error) {
        console.log('Email error',error)
    }
}

// Function to send email notification for location request status
export const sendLocationRequestStatusEmail = async (userEmail, userName, status) => {

    // Send email notification using Nodemailer
    try {
        const emailResponse = await transporter.sendMail({
            from: `"SafarSathi" <${process.env.NODEMAILER_EMAIL}>`, // Sender's email
            to: userEmail, // Recipient's email
            subject: `Location Request Status Updated to ${status}`,
            text: `Dear ${userName || "User"}, Your location request status has been updated to ${status}. Thank you!`,
            html: LocationRequestStatus_Email_Template(userName, status), // HTML email body
        });

        console.log("Email Sent Successfully:", emailResponse);
    } catch (error) {
        console.error("Failed to send email:", error);
        throw new ErrorHandler("Failed to send email", 500);
    }
};



const Verification_Email_Template = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
          }
          .container {
              max-width: 600px;
              margin: 30px auto;
              background: #ffffff;
              border-radius: 8px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
              overflow: hidden;
              border: 1px solid #ddd;
          }
          .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              text-align: center;
              font-size: 26px;
              font-weight: bold;
          }
          .content {
              padding: 25px;
              color: #333;
              line-height: 1.8;
          }
          .verification-code {
              display: block;
              margin: 20px 0;
              font-size: 22px;
              color: #4CAF50;
              background: #e8f5e9;
              border: 1px dashed #4CAF50;
              padding: 10px;
              text-align: center;
              border-radius: 5px;
              font-weight: bold;
              letter-spacing: 2px;
          }
          .footer {
              background-color: #f4f4f4;
              padding: 15px;
              text-align: center;
              color: #777;
              font-size: 12px;
              border-top: 1px solid #ddd;
          }
          p {
              margin: 0 0 15px;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">Verify Your Email</div>
          <div class="content">
              <p>Hello,</p>
              <p>Thank you for signing up! Please confirm your email address by entering the code below:</p>
              <span class="verification-code">{verificationCode}</span>
              <p>If you did not create an account, no further action is required. If you have any questions, feel free to contact our support team.</p>
          </div>
          <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SafarSathi. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>
`;




const Welcome_Email_Template = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Our Community</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
              color: #333;
          }
          .container {
              max-width: 600px;
              margin: 30px auto;
              background: #ffffff;
              border-radius: 8px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
              overflow: hidden;
              border: 1px solid #ddd;
          }
          .header {
              background-color: #007BFF;
              color: white;
              padding: 20px;
              text-align: center;
              font-size: 26px;
              font-weight: bold;
          }
          .content {
              padding: 25px;
              line-height: 1.8;
          }
          .welcome-message {
              font-size: 18px;
              margin: 20px 0;
          }
          .button {
              display: inline-block;
              padding: 12px 25px;
              margin: 20px 0;
              background-color: #007BFF;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              text-align: center;
              font-size: 16px;
              font-weight: bold;
              transition: background-color 0.3s;
          }
          .button:hover {
              background-color: #0056b3;
          }
          .footer {
              background-color: #f4f4f4;
              padding: 15px;
              text-align: center;
              color: #777;
              font-size: 12px;
              border-top: 1px solid #ddd;
          }
          p {
              margin: 0 0 15px;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">Welcome to Our Community!</div>
          <div class="content">
              <p class="welcome-message">Hello {name},</p>
              <p>We’re thrilled to have you join us! Your registration was successful, and we’re committed to providing you with the best experience possible.</p>
              <p>Here’s how you can get started:</p>
              <ul>
                  <li>Explore our features and customize your experience.</li>
                  <li>Stay informed by checking out our blog for the latest updates and tips.</li>
                  <li>Reach out to our support team if you have any questions or need assistance.</li>
              </ul>
              <a href="#" class="button">Get Started</a>
              <p>If you need any help, don’t hesitate to contact us. We’re here to support you every step of the way.</p>
          </div>
          <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SafarSathi. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>
`;

// locationRequestStatusEmailTemplate.js

const LocationRequestStatus_Email_Template = (userName, status) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Location Request Status</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 30px auto;
                background: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                border: 1px solid #ddd;
            }
            .header {
                background-color: #007BFF;
                color: white;
                padding: 20px;
                text-align: center;
                font-size: 26px;
                font-weight: bold;
            }
            .content {
                padding: 25px;
                color: #333;
                line-height: 1.8;
            }
            .status-update {
                display: block;
                margin: 20px 0;
                font-size: 22px;
                color: #007BFF;
                background: #e8f5ff;
                border: 1px dashed #007BFF;
                padding: 10px;
                text-align: center;
                border-radius: 5px;
                font-weight: bold;
                letter-spacing: 1px;
            }
            .footer {
                background-color: #f4f4f4;
                padding: 15px;
                text-align: center;
                color: #777;
                font-size: 12px;
                border-top: 1px solid #ddd;
            }
            p {
                margin: 0 0 15px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">Location Request Status Update</div>
            <div class="content">
                <p>Dear ${userName || "User"},</p>
                <p>Your location request status has been updated to:</p>
                <span class="status-update">${status.toUpperCase()}</span>
                <p>If you have any questions, feel free to contact our support team. Thank you for using our services!</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} SafarSathi. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
`;
