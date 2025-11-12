# YouTube API Setup Guide

This guide explains how to set up the YouTube Data API v3 to enable health video recommendations in the health report section.

## Prerequisites

- A Google Cloud Platform (GCP) account
- A GCP project with billing enabled (YouTube API has free quota)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "AI Health Analyzer")
5. Click "Create"

## Step 2: Enable YouTube Data API v3

1. In the Google Cloud Console, navigate to **APIs & Services** > **Library**
2. Search for "YouTube Data API v3"
3. Click on it and then click **Enable**

## Step 3: Create API Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Your API key will be generated
4. (Optional but recommended) Click **Restrict Key** to:
   - Under **API restrictions**, select "Restrict key" and choose "YouTube Data API v3"
   - Under **Application restrictions**, you can restrict by IP or HTTP referrer for security

## Step 4: Add API Key to Backend

1. Open your backend `.env` file
2. Add the following line:
   ```
   YOUTUBE_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with the API key you just created

## Step 5: Install Dependencies

The backend already includes `axios` in `package.json`. If you haven't installed it yet, run:

```bash
cd AI-health-Backend/Ai-health-Analyser-Backend
npm install
```

## Step 6: Test the Integration

1. Start your backend server
2. Generate a health report with symptoms
3. Navigate to the report page
4. You should see a "Related Health Videos" section with 5 YouTube videos

## API Quota and Limits

- **Free Tier**: 10,000 units per day
- **Search API call**: 100 units per request
- **Daily limit**: ~100 search requests per day (free tier)

If you need more quota, you can:
1. Enable billing in your GCP project
2. Request a quota increase in the Google Cloud Console

## Troubleshooting

### Error: "YouTube API key is not configured"
- Make sure `YOUTUBE_API_KEY` is set in your `.env` file
- Restart your backend server after adding the key

### Error: "YouTube API quota exceeded"
- You've reached your daily quota limit
- Wait 24 hours or enable billing for higher limits

### Error: "API key is invalid"
- Verify your API key is correct
- Check if the YouTube Data API v3 is enabled in your GCP project
- Ensure there are no restrictions blocking your server's IP

### No videos showing up
- Check browser console for errors
- Verify the API key is working by testing the endpoint directly
- Ensure symptoms are being passed correctly to the API

## Security Best Practices

1. **Never commit your API key to version control**
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Restrict your API key**
   - Limit to YouTube Data API v3 only
   - Restrict by IP address or HTTP referrer if possible

3. **Monitor usage**
   - Check API usage in Google Cloud Console
   - Set up billing alerts to avoid unexpected charges

## Example .env Configuration

```env
# YouTube API Configuration
YOUTUBE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Other environment variables...
GEMINI_API_KEY=your_gemini_key
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

## Support

For more information, visit:
- [YouTube Data API v3 Documentation](https://developers.google.com/youtube/v3)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Quota Information](https://developers.google.com/youtube/v3/getting-started#quota)

