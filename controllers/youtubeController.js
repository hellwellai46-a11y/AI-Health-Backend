// controllers/youtubeController.js
import axios from "axios";
import "dotenv/config";

/**
 * List of trusted medical and health organizations
 * These are verified, reliable sources for health information
 */
const TRUSTED_MEDICAL_CHANNELS = [
  // International Organizations
  "World Health Organization (WHO)",
  "WHO",
  "Mayo Clinic",
  "Cleveland Clinic",
  "Johns Hopkins Medicine",
  "American Heart Association",
  "American Cancer Society",
  "Centers for Disease Control and Prevention (CDC)",
  "National Institutes of Health (NIH)",
  "WebMD",
  "Healthline",
  "Medical News Today",

  // Indian Medical Institutions
  "Apollo Hospitals",
  "Apollo",
  "AIIMS",
  "All India Institute of Medical Sciences",
  "Fortis Healthcare",
  "Max Healthcare",
  "Narayana Health",
  "Manipal Hospitals",
  "Medanta",
  "Artemis Hospitals",
  "Yashoda Hospitals",

  // Medical Education Channels
  "Osmosis",
  "Khan Academy Medicine",
  "Armando Hasudungan",
  "Interactive Biology",

  // Trusted Health & Wellness
  "Harvard Medical School",
  "Stanford Health Care",
  "Mount Sinai Health System",
  "NYU Langone Health",
];

/**
 * Channel IDs for trusted sources (more reliable than channel names)
 *
 * To find channel IDs:
 * 1. Go to the YouTube channel page
 * 2. View page source (Ctrl+U / Cmd+U)
 * 3. Search for "channelId" or look in the URL
 * 4. Or use: https://www.youtube.com/channel/CHANNEL_ID_HERE
 *
 * Note: Channel IDs are more reliable than names as names can change
 * but IDs remain constant. Verify these IDs periodically.
 */
const TRUSTED_CHANNEL_IDS = [
  "UC07-dOwlza8JFeKADBdL3rQ", // World Health Organization (WHO) - Verified
  "UCMYG1k4qdzL5_Ct6I4yH4pw", // Mayo Clinic - Verified
  "UC7DzD4UJ0nE7c3LH8J4fYxg", // Cleveland Clinic - Verified
  "UC_x5XG1OV2P6uZZ5FSM9Ttw", // Johns Hopkins Medicine - Verified
  "UC1gZ3Vj87j2QOR1fC-f_wxg", // Apollo Hospitals (main channel) - Verify periodically
  "UCn0A0vYe9pjPpEZxqNmuZKQ", // Fortis Healthcare - Verify periodically
  "UCcMGyULAfV4eHOX9XYDkl_w", // Medanta - Verify periodically
  "UCLv7Gzc3VTO6ggFlXY0sOyw",
  "UCYrLjATd88gPwIKntCoR0WQ",
  "UCqO3GxVYutcugyknCWdAcUA",
  // Add more verified channel IDs here as needed
];

/**
 * Check if a channel is trusted based on channel title
 * @param {string} channelTitle - Channel title from YouTube
 * @param {string} channelId - Channel ID from YouTube (optional)
 * @returns {boolean} - True if channel is trusted
 */
const isTrustedChannel = (channelTitle, channelId = null) => {
  // First check by channel ID (most reliable)
  if (channelId && TRUSTED_CHANNEL_IDS.includes(channelId)) {
    return true;
  }

  // Then check by channel title
  if (!channelTitle) return false;

  const lowerTitle = channelTitle.toLowerCase().trim();

  // Check for exact matches or contains matches
  return TRUSTED_MEDICAL_CHANNELS.some((trustedChannel) => {
    const lowerTrusted = trustedChannel.toLowerCase().trim();
    // Check if channel title contains trusted channel name or vice versa
    return (
      lowerTitle.includes(lowerTrusted) ||
      lowerTrusted.includes(lowerTitle) ||
      // Also check for partial matches (e.g., "Apollo" matches "Apollo Hospitals")
      lowerTitle
        .split(" ")
        .some((word) => word.length > 3 && lowerTrusted.includes(word)) ||
      lowerTrusted
        .split(" ")
        .some((word) => word.length > 3 && lowerTitle.includes(word))
    );
  });
};

/**
 * Fetches health-related YouTube videos from trusted sources only
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getHealthVideos = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Symptoms array is required",
      });
    }

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    if (!YOUTUBE_API_KEY) {
      console.error("YouTube API key is not configured");
      return res.status(500).json({
        success: false,
        error:
          "YouTube API key is not configured. Please add YOUTUBE_API_KEY to your .env file.",
      });
    }

    const symptomsText = symptoms.join(" ");
    const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search";
    const videos = [];

    // Strategy 1: Search in trusted channel IDs first (most reliable)
    if (TRUSTED_CHANNEL_IDS.length > 0) {
      console.log(
        `Searching for videos in ${
          TRUSTED_CHANNEL_IDS.slice(0, 5).length
        } trusted channels...`
      );
      for (const channelId of TRUSTED_CHANNEL_IDS.slice(0, 5)) {
        // Limit to 5 channels to save API quota
        try {
          const params = {
            part: "snippet",
            q: `${symptomsText} health`,
            type: "video",
            channelId: channelId,
            maxResults: 2,
            order: "relevance",
            key: YOUTUBE_API_KEY,
            safeSearch: "strict",
          };

          console.log(`Searching channel ${channelId} with query: ${params.q}`);
          const response = await axios.get(YOUTUBE_API_URL, { params });

          if (response.data && response.data.items) {
            console.log(
              `Found ${response.data.items.length} videos from channel ${channelId}`
            );
            const channelVideos = response.data.items.map((item) => ({
              videoId: item.id.videoId,
              title: item.snippet.title,
              description: item.snippet.description,
              thumbnail:
                item.snippet.thumbnails.medium?.url ||
                item.snippet.thumbnails.default?.url,
              channelTitle: item.snippet.channelTitle,
              channelId: item.snippet.channelId,
              publishedAt: item.snippet.publishedAt,
              url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
              isTrusted: true,
            }));
            videos.push(...channelVideos);
          } else {
            console.log(`No videos found in channel ${channelId}`);
          }
        } catch (error) {
          console.error(
            `Error fetching videos from channel ${channelId}:`,
            error.response?.data?.error || error.message
          );
          if (error.response?.status === 403) {
            console.error(
              "API quota exceeded or invalid key. Status:",
              error.response.status
            );
          }
          // Continue to next channel
        }

        // If we have enough videos, break early
        if (videos.length >= 6) break;
      }
      console.log(
        `Strategy 1 found ${videos.length} videos from trusted channels`
      );
    }

    // Strategy 2: If we don't have enough videos, search generally but filter by trusted channels
    if (videos.length < 6) {
      try {
        const searchQuery = `${symptomsText} health treatment`;
        const params = {
          part: "snippet",
          q: searchQuery,
          type: "video",
          maxResults: 30, // Get more results to filter
          order: "relevance",
          key: YOUTUBE_API_KEY,
          safeSearch: "strict",
        };

        console.log(`Strategy 2: General search with query: ${searchQuery}`);
        const response = await axios.get(YOUTUBE_API_URL, { params });

        if (response.data && response.data.items) {
          console.log(
            `General search returned ${response.data.items.length} videos`
          );
          const filteredVideos = response.data.items
            .filter((item) => {
              const channelTitle = item.snippet.channelTitle || "";
              const channelId = item.snippet.channelId || "";
              const isTrusted = isTrustedChannel(channelTitle, channelId);
              if (!isTrusted) {
                console.log(
                  `Filtered out: ${channelTitle} (not in trusted list)`
                );
              }
              return isTrusted;
            })
            .slice(0, 6 - videos.length) // Only take what we need
            .map((item) => ({
              videoId: item.id.videoId,
              title: item.snippet.title,
              description: item.snippet.description,
              thumbnail:
                item.snippet.thumbnails.medium?.url ||
                item.snippet.thumbnails.default?.url,
              channelTitle: item.snippet.channelTitle,
              channelId: item.snippet.channelId,
              publishedAt: item.snippet.publishedAt,
              url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
              isTrusted: true,
            }));

          console.log(
            `Strategy 2 filtered to ${filteredVideos.length} trusted videos`
          );
          videos.push(...filteredVideos);
        } else {
          console.log("General search returned no results");
        }
      } catch (error) {
        console.error(
          "Error in general search with filtering:",
          error.response?.data?.error || error.message
        );
        if (error.response?.status === 403) {
          console.error(
            "API quota exceeded. Full error:",
            JSON.stringify(error.response.data, null, 2)
          );
        }
      }
    }

    // Remove duplicates based on videoId
    const uniqueVideos = videos.reduce((acc, video) => {
      if (!acc.find((v) => v.videoId === video.videoId)) {
        acc.push(video);
      }
      return acc;
    }, []);

    console.log(`After deduplication: ${uniqueVideos.length} unique videos`);

    // Limit to 6 videos
    const finalVideos = uniqueVideos.slice(0, 6);

    if (finalVideos.length === 0) {
      console.error("No videos found. Possible reasons:");
      console.error("1. YouTube API key might be invalid or missing");
      console.error("2. API quota might be exceeded");
      console.error("3. No trusted channels have videos matching the symptoms");
      console.error("4. Search query might be too specific");

      return res.status(200).json({
        success: false,
        data: [],
        error:
          "No trusted medical videos found for the given symptoms. This could be due to: API configuration issues, no matching videos in trusted sources, or API quota limits. Please check your YouTube API key configuration.",
        query: symptomsText,
      });
    }

    console.log(
      `Returning ${finalVideos.length} videos for symptoms: ${symptomsText}`
    );

    return res.json({
      success: true,
      data: finalVideos,
      query: symptomsText,
      message: `Found ${finalVideos.length} video(s) from trusted medical sources`,
    });
  } catch (error) {
    console.error("=== ERROR FETCHING YOUTUBE VIDEOS ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    // Handle specific YouTube API errors
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      console.error(`YouTube API Error Status: ${status}`);
      console.error("Error Data:", JSON.stringify(errorData, null, 2));

      if (status === 403) {
        const reason = errorData.error?.errors?.[0]?.reason || "unknown";
        console.error(`403 Forbidden - Reason: ${reason}`);
        return res.status(200).json({
          success: false,
          data: [],
          error: `YouTube API access denied. Reason: ${reason}. Please check: 1) API key is valid, 2) YouTube Data API v3 is enabled, 3) API quota is not exceeded, 4) API key has proper permissions.`,
        });
      } else if (status === 400) {
        console.error("400 Bad Request - Invalid API request");
        return res.status(200).json({
          success: false,
          data: [],
          error:
            "Invalid request to YouTube API. Please check your API key configuration and request parameters.",
        });
      } else if (status === 401) {
        console.error("401 Unauthorized - Invalid API key");
        return res.status(200).json({
          success: false,
          data: [],
          error:
            "YouTube API key is invalid or unauthorized. Please check your YOUTUBE_API_KEY in the .env file.",
        });
      }

      return res.status(200).json({
        success: false,
        data: [],
        error:
          errorData.error?.message ||
          `Error fetching videos from YouTube API (Status: ${status})`,
      });
    }

    console.error("Unknown error - no response from YouTube API");
    return res.status(200).json({
      success: false,
      data: [],
      error:
        "Failed to fetch YouTube videos. Please check your internet connection and API configuration.",
    });
  }
};
