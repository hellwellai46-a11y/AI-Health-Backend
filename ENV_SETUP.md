# 🔐 Environment Variables Setup Guide

## ⚠️ Security Notice

**IMPORTANT**: The `.env` file was previously committed to this repository's git history (commit `7bab73e`). While it has been removed from the working tree, it still exists in the git history. 

**Action Required**:
1. **All API keys and credentials in that commit should be considered compromised**
2. **Rotate all secrets immediately**:
   - Generate a new GEMINI_API_KEY
   - Change MongoDB password and update connection string
   - Generate new SMTP app password
   - Update JWT_SECRET to a new random value

To completely remove sensitive data from git history (if needed), contact the repository administrator about using tools like `git filter-branch` or BFG Repo-Cleaner. However, note that this requires coordination with all collaborators as it rewrites history.

---

## 📋 Quick Setup

### 1. Copy the Example File

```bash
cp .env.example .env
```

### 2. Fill in Your Values

Edit the `.env` file and replace the placeholder values with your actual credentials.

---

## 🔑 Required Environment Variables

### Database Configuration

**MONGO_URI**
- **Description**: MongoDB connection string
- **Required**: Yes
- **Format**: 
  - Local: `mongodb://localhost:27017/database-name`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
- **Example**: `mongodb://localhost:27017/healwell-db`
- **Setup**: 
  - For local: Install MongoDB locally
  - For cloud: Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### AI/ML Services

**GEMINI_API_KEY**
- **Description**: Google Gemini API key for AI-powered health analysis
- **Required**: Yes
- **Setup**: 
  1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
  2. Create a new API key
  3. Copy the key to your `.env` file

**YOUTUBE_API_KEY**
- **Description**: YouTube Data API key for video recommendations
- **Required**: Optional (feature will be disabled without it)
- **Setup**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  2. Create a new project or select existing
  3. Enable YouTube Data API v3
  4. Create credentials (API key)
  5. Copy the key to your `.env` file

**ML_API_URL**
- **Description**: URL for the ML prediction service
- **Required**: Optional (defaults to `http://localhost:8000`)
- **Default**: `http://localhost:8000`
- **Setup**: See [ML_INTEGRATION_GUIDE.md](./ML_INTEGRATION_GUIDE.md)

### Authentication

**JWT_SECRET**
- **Description**: Secret key for signing JWT tokens
- **Required**: Yes
- **Security**: Use a long, random string (at least 32 characters)
- **Example**: `your-super-secret-jwt-key-change-in-production`
- **Generate**: 
  ```bash
  # Generate a secure random string
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### Email Configuration

The application supports sending reminder emails via SMTP. This is **optional** - the app will run without email configuration.

**SMTP_HOST**
- **Description**: SMTP server hostname
- **Default**: `smtp.gmail.com`
- **Example**: `smtp.gmail.com`

**SMTP_PORT**
- **Description**: SMTP server port
- **Default**: `587`
- **Common Values**: 
  - `587` for TLS
  - `465` for SSL
  - `25` for unencrypted (not recommended)

**SMTP_SECURE**
- **Description**: Whether to use SSL/TLS
- **Default**: `false`
- **Values**: `true` for port 465, `false` for port 587

**SMTP_USER**
- **Description**: SMTP username (usually your email)
- **Example**: `your-email@gmail.com`

**SMTP_PASS**
- **Description**: SMTP password or app-specific password
- **For Gmail**:
  1. Enable 2-factor authentication on your Google account
  2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
  3. Generate a new app password for "Mail"
  4. Use this 16-character password (without spaces)

### Server Configuration

**PORT**
- **Description**: Server port number
- **Default**: `5000`
- **Example**: `5000`

**NODE_ENV**
- **Description**: Application environment
- **Values**: `development`, `production`, `test`
- **Default**: `development`

### Frontend Configuration

**FRONTEND_URL**
- **Description**: Frontend URL for development (CORS)
- **Default**: `http://localhost:5173`
- **Example**: `http://localhost:5173`

**FRONTEND_URL_PROD**
- **Description**: Frontend URL for production (CORS)
- **Example**: `https://your-app.com`

---

## 🛠️ Complete Setup Example

Here's a complete `.env` file example for local development:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/healwell-db

# Authentication
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c8e82a19e6764b5c39b35e4f87d8cc1b3

# AI Services
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
YOUTUBE_API_KEY=AIzaSyYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
ML_API_URL=http://localhost:8000

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourapp@gmail.com
SMTP_PASS=abcd efgh ijkl mnop

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## ✅ Verification

After setting up your `.env` file, verify it's working:

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Check the console output**:
   - ✅ MongoDB connection should succeed
   - ✅ Server should start on specified PORT
   - ⚠️  Email warnings are OK if SMTP not configured

3. **Test the API**:
   ```bash
   curl http://localhost:5000
   ```

---

## 🔒 Security Best Practices

1. **Never commit `.env` files**: The `.env` file is already in `.gitignore`
2. **Rotate compromised secrets**: If you accidentally commit secrets, rotate them immediately
3. **Use strong JWT secrets**: Generate random strings, don't use predictable values
4. **Restrict API keys**: Use API key restrictions in Google Cloud Console
5. **Use environment variables in production**: Never hardcode secrets
6. **Keep `.env.example` updated**: Update it when adding new environment variables
7. **Use different secrets per environment**: Don't use the same keys for dev and prod

---

## 🆘 Troubleshooting

### MongoDB Connection Fails

**Error**: `MONGO_URI environment variable is not set!`
- **Solution**: Make sure `.env` file exists and contains `MONGO_URI`

**Error**: `MongoServerError: Authentication failed`
- **Solution**: Check username/password in connection string

**Error**: `MongooseServerSelectionError`
- **Solution**: 
  - Check MongoDB is running (if local)
  - Check network connectivity (if Atlas)
  - Verify connection string format

### SMTP Errors

**Error**: `Invalid login: 535-5.7.8 Username and Password not accepted`
- **Solution**: Use App Password instead of regular Gmail password

**Warning**: `Email service not configured`
- **Note**: This is OK - email is optional. App will work without it.

### API Key Issues

**Error**: `API_KEY_INVALID`
- **Solution**: 
  - Verify you copied the full API key
  - Check for extra spaces or quotes
  - Regenerate the API key if needed

---

## 📚 Additional Resources

- [Email Setup Guide](./EMAIL_SETUP.md)
- [YouTube API Setup Guide](./YOUTUBE_API_SETUP.md)
- [ML Integration Guide](./ML_INTEGRATION_GUIDE.md)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Google AI Studio](https://makersuite.google.com/)

---

## 🤝 Need Help?

If you encounter issues:
1. Check this documentation first
2. Review error messages carefully
3. Open an issue on GitHub
4. Contact the development team
