# 🔐 Environment Variables Setup Guide

This guide explains how to properly configure environment variables for the HealWell AI Backend.

## ⚠️ Security Notice

**IMPORTANT:** A `.env` file containing sensitive credentials was previously committed to this repository's git history (commits prior to November 2025). While the file has been removed from tracking, the credentials remain accessible in the git history.

### Exposed Credentials (Now Invalid)

The following credentials were exposed and **must be considered compromised**:

- **GEMINI_API_KEY**: Google Gemini API key
- **MONGO_URI**: MongoDB connection string with username and password
- **SMTP_USER** and **SMTP_PASS**: Gmail account credentials

### Required Actions

If you are the owner of these credentials:

1. ✅ **Rotate the Gemini API Key** - Generate a new API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. ✅ **Change MongoDB Password** - Update the database user password in MongoDB Atlas
3. ✅ **Revoke Gmail App Password** - Generate a new app password or use a different email account
4. ✅ **Update Application Configuration** - Use the new credentials in your `.env` file

## 📝 Setup Instructions

### Step 1: Copy the Example File

```bash
cp .env.example .env
```

### Step 2: Configure Each Variable

Open the `.env` file and replace placeholder values with your actual credentials.

## 🔧 Environment Variables Reference

### Server Configuration

```env
PORT=5000
NODE_ENV=development
```

- **PORT**: The port number the server will listen on (default: 5000)
- **NODE_ENV**: Environment mode (`development`, `production`, or `test`)

### Database Configuration

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

- **MONGO_URI**: MongoDB connection string
- **How to get it:**
  1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  2. Create a cluster (free tier available)
  3. Click "Connect" → "Connect your application"
  4. Copy the connection string and replace `<username>` and `<password>`

### Authentication

```env
JWT_SECRET=your_very_secure_random_string_here
```

- **JWT_SECRET**: Secret key for signing JWT tokens
- **How to generate:** Use a strong random string (at least 32 characters)
  ```bash
  # Generate a secure random string
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### AI Services

#### Google Gemini API

```env
GEMINI_API_KEY=your_api_key_here
```

- **GEMINI_API_KEY**: API key for Google's Gemini AI model
- **How to get it:**
  1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
  2. Sign in with your Google account
  3. Create a new API key
  4. Copy and paste it into your `.env` file

#### YouTube API

```env
YOUTUBE_API_KEY=your_youtube_api_key_here
```

- **YOUTUBE_API_KEY**: YouTube Data API v3 key for video recommendations
- **How to get it:**
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Create a new project or select an existing one
  3. Enable the "YouTube Data API v3"
  4. Go to "Credentials" and create an API key
  5. Copy the API key to your `.env` file

For detailed YouTube API setup, see [YOUTUBE_API_SETUP.md](./YOUTUBE_API_SETUP.md).

#### Machine Learning API (Optional)

```env
ML_API_URL=http://localhost:8000
```

- **ML_API_URL**: URL of the ML prediction service (if you're running one separately)
- Leave as default if not using external ML services

### Email Configuration (Optional)

Email configuration is optional but required for sending reminder notifications.

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

- **SMTP_HOST**: SMTP server hostname
- **SMTP_PORT**: SMTP server port (587 for TLS, 465 for SSL)
- **SMTP_SECURE**: Set to `true` for port 465, `false` for port 587
- **SMTP_USER**: Your email address
- **SMTP_PASS**: Email account password or app password

**For detailed email setup instructions (including Gmail App Password setup), see [EMAIL_SETUP.md](./EMAIL_SETUP.md).**

### Frontend URLs (CORS)

```env
FRONTEND_URL=http://localhost:5173
FRONTEND_URL_PROD=https://your-domain.com
```

- **FRONTEND_URL**: Development frontend URL (for local development)
- **FRONTEND_URL_PROD**: Production frontend URL

## ✅ Verification

After setting up your `.env` file:

1. **Verify environment configuration:**
   ```bash
   npm run verify-env
   ```
   This will check if all required variables are set and warn about placeholder values.

2. **Test database connection:**
   ```bash
   npm run dev
   ```
   You should see: `✅ MongoDB Connected`

3. **Verify environment variables are loaded:**
   Check the console output for any missing required variables

4. **Test API endpoints:**
   Try accessing `http://localhost:5000` (or your configured PORT)

## 🔒 Security Best Practices

### Do's ✅

- ✅ Always use `.env` for sensitive credentials
- ✅ Add `.env` to `.gitignore` (already configured)
- ✅ Use different credentials for development and production
- ✅ Rotate API keys and passwords regularly
- ✅ Use strong, unique passwords for each service
- ✅ Use App Passwords for Gmail (not your main password)
- ✅ Restrict API key permissions to only what's needed
- ✅ Share `.env.example` (without real values) with team members

### Don'ts ❌

- ❌ Never commit `.env` files to version control
- ❌ Never share `.env` files in chat, email, or public forums
- ❌ Never hardcode credentials in source code
- ❌ Never use the same credentials across multiple environments
- ❌ Never store API keys in client-side code
- ❌ Never reuse exposed/compromised credentials

## 🆘 Troubleshooting

### "MongoDB connection failed"
- Verify your `MONGO_URI` is correct
- Check if your IP address is whitelisted in MongoDB Atlas
- Ensure network connectivity

### "Invalid API key" (Gemini)
- Verify the API key is copied correctly (no extra spaces)
- Check if the API key is enabled in Google AI Studio
- Ensure you haven't exceeded API quota

### "Email not sending"
- See [EMAIL_SETUP.md](./EMAIL_SETUP.md) for detailed troubleshooting
- Verify SMTP credentials are correct
- For Gmail, ensure you're using an App Password

### "CORS error" from frontend
- Check that `FRONTEND_URL` matches your frontend's actual URL
- Verify the frontend URL includes the protocol (http:// or https://)

## 📚 Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [Nodemailer Documentation](https://nodemailer.com/about/)

## 🤝 Getting Help

If you encounter issues:

1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Review the documentation files (EMAIL_SETUP.md, YOUTUBE_API_SETUP.md, etc.)
4. Check that all required services are running and accessible
5. Open an issue in the repository with detailed error information

---

**Remember:** Never commit your `.env` file. Always use `.env.example` as a template and keep your actual credentials secure.
