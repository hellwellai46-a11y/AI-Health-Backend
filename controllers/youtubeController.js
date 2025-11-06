// controllers/youtubeController.js
import axios from 'axios';
import "dotenv/config";

/**
 * Fetches health-related YouTube videos based on symptoms
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getHealthVideos = async (req, res) => {
  try {
    const { symptoms } = req.body;
    
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Symptoms array is required'
      });
    }

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key is not configured');
      return res.status(500).json({
        success: false,
        error: 'YouTube API key is not configured. Please add YOUTUBE_API_KEY to your .env file.'
      });
    }

    // Create search query from symptoms
    // Combine symptoms into a health-related search query
    const symptomsText = symptoms.join(' ');
    const searchQuery = `${symptomsText} health treatment remedy`;
    
    // YouTube Data API v3 endpoint
    const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';
    
    const params = {
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      maxResults: 5,
      order: 'relevance',
      videoCategoryId: '27', // Education category
      key: YOUTUBE_API_KEY,
      safeSearch: 'strict'
    };

    const response = await axios.get(YOUTUBE_API_URL, { params });
    
    if (!response.data || !response.data.items) {
      return res.status(500).json({
        success: false,
        error: 'No videos found or invalid response from YouTube API'
      });
    }

    // Format the response
    const videos = response.data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));

    return res.json({
      success: true,
      data: videos,
      query: searchQuery
    });

  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    
    // Handle specific YouTube API errors
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 403) {
        return res.status(403).json({
          success: false,
          error: 'YouTube API quota exceeded or API key is invalid. Please check your API key and quota.'
        });
      } else if (status === 400) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request to YouTube API. Please check your API key configuration.'
        });
      }
      
      return res.status(status).json({
        success: false,
        error: errorData.error?.message || 'Error fetching videos from YouTube API'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch YouTube videos. Please try again later.'
    });
  }
};

