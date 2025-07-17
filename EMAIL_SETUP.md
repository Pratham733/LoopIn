# Email Setup Guide (Gmail SMTP)

This guide will help you set up email functionality for your LoopIn app using Gmail SMTP - a simple and free method!

## 1. Gmail Setup

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings: [https://myaccount.google.com/](https://myaccount.google.com/)
2. Click on "Security" in the left sidebar
3. Enable "2-Step Verification" if not already enabled

### Step 2: Generate App Password
1. Go to Google Account settings: [https://myaccount.google.com/](https://myaccount.google.com/)
2. Click on "Security" → "2-Step Verification"
3. Scroll down and click "App passwords"
4. Select "Mail" and "Other (Custom name)"
5. Enter a name like "LoopIn App"
6. Click "Generate"
7. **Copy the 16-character password** (you won't see it again!)

## 2. Environment Variables

Create a `.env.local` file in your project root:

```env
# Gmail Configuration
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password

# Admin email (where you'll receive notifications about new signups)
ADMIN_EMAIL=your_email@gmail.com

# App configuration
APP_NAME=LoopIn
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Install Dependencies

Run this command to install nodemailer:

```bash
npm install nodemailer @types/nodemailer
```

## 4. Test the Email Functionality

### Test the API Endpoint
```bash
curl -X POST http://localhost:3000/api/send-welcome-email \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "username": "testuser"
  }'
```

### Test User Signup
1. Start your development server: `npm run dev`
2. Go to your app and create a new account
3. Check your email for the welcome message
4. Check your admin email for the notification

## 5. Troubleshooting

### Common Issues

**"Gmail credentials not configured"**
- Make sure `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set in `.env.local`
- Restart your development server after adding environment variables

**"Invalid login" or "Authentication failed"**
- Make sure you're using the App Password, not your regular Gmail password
- Verify 2-Factor Authentication is enabled
- Check that the App Password is exactly 16 characters

**"Less secure app access" error**
- This is normal - you're using App Passwords which is the secure way
- Make sure you're using the App Password, not your regular password

**Emails going to spam**
- Check your spam folder
- Add your app's email address to your contacts
- Use a professional sender name in the email templates

### Debug Mode
Add this to your `.env.local` to see detailed email logs:

```env
DEBUG_EMAIL=true
```

## 6. Production Deployment

### Environment Variables
Set these in your production environment:

```env
GMAIL_USER=your_production_email@gmail.com
GMAIL_APP_PASSWORD=your_production_app_password
ADMIN_EMAIL=your_production_email@gmail.com
APP_NAME=LoopIn
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Gmail Limits
- **Daily limit**: 500 emails per day (free Gmail account)
- **Rate limit**: 100 emails per hour
- For higher volumes, consider upgrading to Google Workspace

## 7. Security Best Practices

- Never commit your App Password to version control
- Use environment variables for all sensitive data
- Consider implementing email verification for new accounts
- Add rate limiting to prevent abuse

## 8. Alternative Setup (SendGrid)

If you prefer SendGrid instead of Gmail:

1. **Install SendGrid**: `npm install @sendgrid/mail`
2. **Get API Key**: Sign up at [SendGrid](https://sendgrid.com/)
3. **Update environment variables**:
   ```env
   SENDGRID_API_KEY=your_sendgrid_api_key
   ADMIN_EMAIL=admin@yourdomain.com
   ```
4. **Update email service**: Replace the Gmail implementation in `src/services/emailService.ts`

## 9. Customization

### Modify Email Templates
Edit the templates in `src/services/emailService.ts`:

- `sendWelcomeEmail()` - Welcome email template
- `sendAdminNotification()` - Admin notification template

### Add More Email Types
You can add more email functions like:
- Password reset emails
- Account verification emails
- Newsletter emails
- Notification emails

That's it! Your app will now send welcome emails to new users and notify you when someone signs up using Gmail SMTP. 