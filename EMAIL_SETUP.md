# 📧 Email Reminder Setup Guide

This guide explains how to configure nodemailer to send email reminders to users.

## 🔧 Configuration

### 1. Install Dependencies

Make sure nodemailer is installed:
```bash
npm install nodemailer
```

### 2. Environment Variables

Add these variables to your `.env` file:

```env
# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Gmail Setup (Recommended)

If using Gmail, you need to:

1. **Enable 2-Step Verification** on your Google account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this app password as `SMTP_PASS` (not your regular password)

**Example:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # Your app password (16 characters)
```

### 4. Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@outlook.com
SMTP_PASS=your_password
```

#### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@yahoo.com
SMTP_PASS=your_app_password
```

#### Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_password
```

#### Secure Connection (SSL/TLS)
```env
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_password
```

## ✅ Testing

1. Start your backend server
2. You should see: `✅ Email service is ready to send messages`
3. If not configured, you'll see: `⚠️ Email service configuration error`

## 📬 How It Works

- Cron job runs every minute to check for due reminders
- If a user has an email address, an email is sent automatically
- If email is not configured or user has no email, the reminder is logged to console only
- Emails are HTML-formatted with reminder details

## 🔒 Security Notes

- Never commit `.env` file to version control
- Use App Passwords for Gmail (not your regular password)
- For production, consider using dedicated email services like:
  - SendGrid
  - AWS SES
  - Mailgun
  - Postmark

## 🐛 Troubleshooting

### Email not sending?

1. **Check environment variables**: Make sure all SMTP variables are set
2. **Check logs**: Look for email service initialization message
3. **Verify credentials**: Test your email/password are correct
4. **Check firewall**: Ensure port 587/465 is not blocked
5. **Gmail specific**: Use App Password, not regular password

### Common Errors

- `Invalid login`: Wrong email or password
- `Connection timeout`: Check SMTP_HOST and SMTP_PORT
- `Authentication failed`: Gmail requires App Password

## 📝 Notes

- Emails are only sent if user has an email address in the database
- If email fails, the reminder is still marked as sent in the database
- Email failures are logged but don't stop the reminder system


