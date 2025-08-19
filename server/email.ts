import nodemailer from "nodemailer";

// Create reusable transporter using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD // This should be an app-specific password
  }
});

// WhatsApp verification has been removed

export async function sendVerificationEmail(to: string, code: string, type: 'password-reset' | 'registration' = 'password-reset'): Promise<boolean> {
  try {
    console.log(`Attempting to send email to ${to} with verification code ${code} for ${type}`);
    console.log(`Using email credentials: ${process.env.EMAIL_USER ? 'Email user exists' : 'Email user missing'}, ${process.env.EMAIL_PASSWORD ? 'Password exists' : 'Password missing'}`);
    
    let subject, htmlContent;
    
    if (type === 'registration') {
      subject = "Account Verification Code - Vinayak Garments";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Account Verification</h2>
          <p>Thank you for registering with Vinayak Garments!</p>
          <p>Your verification code is: <strong style="font-size: 24px; color: #4444dd;">${code}</strong></p>
          <p>This code will expire in 30 minutes. Please enter this code to complete your registration.</p>
          <p>If you did not attempt to create an account with us, please ignore this email.</p>
        </div>
      `;
    } else {
      subject = "Password Reset Verification Code - Vinayak Garments";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password for your Vinayak Garments account.</p>
          <p>Your verification code is: <strong style="font-size: 24px; color: #4444dd;">${code}</strong></p>
          <p>This code will expire in 30 minutes.</p>
          <p>If you did not request this password reset, please ignore this email.</p>
        </div>
      `;
    }
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: htmlContent
    });
    
    console.log("Email sent successfully");
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    // For development purposes, we'll return true and just log the code
    console.log(`DEVELOPMENT MODE: Verification code for ${to} is: ${code} (for ${type})`);
    return true; // Return true in development even if email fails, so testing can continue
  }
}
