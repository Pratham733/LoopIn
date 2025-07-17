import nodemailer from 'nodemailer';

// Email service configuration
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || GMAIL_USER;
const APP_NAME = process.env.APP_NAME || 'LoopIn';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Create email transporter using Gmail SMTP
 */
function createTransporter() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn('Gmail credentials not configured. Email will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD
    }
  });
}

/**
 * Send email using Gmail SMTP
 */
export async function sendEmail(emailData: EmailData): Promise<boolean> {
  const transporter = createTransporter();
  
  if (!transporter || !GMAIL_USER) {
    return false;
  }

  try {
    const mailOptions = {
      from: `"${APP_NAME} Admin" <${GMAIL_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${emailData.to}`);
    console.log('Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(userEmail: string, username: string): Promise<boolean> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${APP_NAME}!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${APP_NAME}! 🎉</h1>
        </div>
        <div class="content">
          <h2>Hi ${username}!</h2>
          <p>Thank you for joining ${APP_NAME}! We're excited to have you as part of our community.</p>
          
          <p>Here's what you can do now:</p>
          <ul>
            <li>Connect with friends and family</li>
            <li>Share your thoughts and experiences</li>
            <li>Discover new people and content</li>
            <li>Stay updated with real-time notifications</li>
          </ul>
          
          <p>If you have any questions or need help getting started, feel free to reach out to our support team.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/chat" class="button">
              Get Started
            </a>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Best regards,<br>
            The ${APP_NAME} Team
          </p>
        </div>
        <div class="footer">
          <p>This email was sent to ${userEmail}</p>
          <p>If you didn't sign up for ${APP_NAME}, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Welcome to ${APP_NAME}! 🎉

Hi ${username}!

Thank you for joining ${APP_NAME}! We're excited to have you as part of our community.

Here's what you can do now:
- Connect with friends and family
- Share your thoughts and experiences  
- Discover new people and content
- Stay updated with real-time notifications

If you have any questions or need help getting started, feel free to reach out to our support team.

Get started: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/chat

Best regards,
The ${APP_NAME} Team

---
This email was sent to ${userEmail}
If you didn't sign up for ${APP_NAME}, you can safely ignore this email.
  `;

  return await sendEmail({
    to: userEmail,
    subject: `Welcome to ${APP_NAME}! 🎉`,
    html: htmlContent,
    text: textContent,
  });
}

/**
 * Send admin notification about new user signup
 */
export async function sendAdminNotification(userEmail: string, username: string): Promise<boolean> {
  if (!GMAIL_USER) {
    console.warn('Gmail user not configured. Admin notification will not be sent.');
    return false;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New User Signup - ${APP_NAME}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New User Signup! 🎉</h1>
        </div>
        <div class="content">
          <h2>Hello Admin!</h2>
          <p>A new user has signed up for ${APP_NAME}.</p>
          
          <div class="info">
            <h3>User Details:</h3>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Signup Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>You can view user analytics and manage accounts from your admin dashboard.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from ${APP_NAME}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: ADMIN_EMAIL,
    subject: `New User Signup: ${username}`,
    html: htmlContent,
  });
} 