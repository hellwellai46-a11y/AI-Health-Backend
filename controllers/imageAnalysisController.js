import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_ID = "gemini-1.5-flash"; // Stable vision-capable Gemini model

// Configure multer for memory storage (store in memory instead of disk)
const storage = multer.memoryStorage();
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Helper function to convert image buffer to base64
function imageToBase64(buffer) {
  return buffer.toString("base64");
}

// Helper function to extract symptoms/keywords from AI response
function extractSymptoms(aiResponse) {
  const symptoms = [];
  const lowerResponse = aiResponse.toLowerCase();

  // Comprehensive medical keywords dictionary
  const keywordCategories = {
    // Physical symptoms
    visual: [
      "rash",
      "redness",
      "swelling",
      "irritation",
      "inflammation",
      "discoloration",
      "patch",
      "spot",
      "lesion",
      "eruption",
      "blister",
      "bump",
      "pimple",
      "acne",
      "hives",
      "wheal",
      "pustule",
      "nodule",
      "plaque",
      "scale",
      "crust",
    ],

    // Sensations
    sensory: [
      "itch",
      "itchy",
      "burning",
      "stinging",
      "painful",
      "tender",
      "sore",
      "warm",
      "hot",
      "throbbing",
    ],

    // Skin conditions
    conditions: [
      "eczema",
      "dermatitis",
      "psoriasis",
      "urticaria",
      "folliculitis",
      "cellulitis",
      "impetigo",
      "ringworm",
      "tinea",
      "fungal",
      "bacterial",
      "viral",
      "infection",
    ],

    // Texture/Appearance
    texture: [
      "dry",
      "peeling",
      "scaly",
      "rough",
      "crusty",
      "flaky",
      "moist",
      "weeping",
      "oozing",
      "bleeding",
      "bruised",
      "wound",
      "cut",
      "scab",
      "scar",
    ],

    // Severity indicators
    severity: [
      "mild",
      "moderate",
      "severe",
      "acute",
      "chronic",
      "localized",
      "diffuse",
      "spreading",
      "worsening",
    ],
  };

  // Flatten all keywords
  const allKeywords = Object.values(keywordCategories).flat();

  // Step 1: Extract direct keyword matches (most reliable)
  allKeywords.forEach((keyword) => {
    // Use word boundary to avoid partial matches (e.g., "rash" in "crash")
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(aiResponse)) {
      const symptom = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      if (!symptoms.includes(symptom)) {
        symptoms.push(symptom);
      }
    }
  });

  // Step 2: Extract from structured medical phrases
  const medicalPatterns = [
    // "Possible rash", "Likely irritation", etc.
    /(?:possible|likely|suggestive of|indicates?|shows?|appears to be|consistent with)\s+([a-z\s]+(?:rash|irritation|allergy|infection|condition|dermatitis|eczema|psoriasis))/gi,

    // "Redness of the skin", "Swelling around the area"
    /(?:redness|swelling|rash|irritation|inflammation|discoloration)\s+(?:of|in|on|around|at)\s+([a-z\s]+(?:skin|area|region|site))/gi,

    // "Signs of X", "Presence of X"
    /(?:signs?|presence|evidence)\s+of\s+([a-z\s]+(?:infection|allergy|inflammation|irritation))/gi,

    // Extract condition names
    /(?:appears to be|consistent with|suggestive of)\s+([a-z]+(?:\s+[a-z]+)?(?:\s+(?:dermatitis|eczema|psoriasis|infection|allergy)))/gi,
  ];

  medicalPatterns.forEach((pattern) => {
    const matches = Array.from(aiResponse.matchAll(pattern));
    matches.forEach((match) => {
      if (match[1]) {
        const extracted = match[1]
          .trim()
          .split(/\s+/)
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(" ");

        // Filter out common stop words
        const stopWords = [
          "the",
          "a",
          "an",
          "of",
          "in",
          "on",
          "at",
          "with",
          "to",
          "for",
        ];
        const words = extracted
          .split(" ")
          .filter((w) => !stopWords.includes(w.toLowerCase()));
        const cleaned = words.join(" ");

        if (cleaned && cleaned.length > 2 && !symptoms.includes(cleaned)) {
          symptoms.push(cleaned);
        }
      }
    });
  });

  // Step 3: Extract symptoms from bullet points or list format
  const listPattern =
    /[-•*]\s*([a-z\s]+(?:rash|redness|swelling|irritation|itch|pain|sore))/gi;
  const listMatches = Array.from(aiResponse.matchAll(listPattern));
  listMatches.forEach((match) => {
    if (match[1]) {
      const cleaned = match[1]
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      if (cleaned && !symptoms.includes(cleaned)) {
        symptoms.push(cleaned);
      }
    }
  });

  // Step 4: Smart fallback - extract important medical terms
  if (symptoms.length === 0) {
    // Extract capitalized words (often medical terms)
    const capitalizedWords = aiResponse.match(
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g
    );
    if (capitalizedWords) {
      const medicalTerms = capitalizedWords
        .filter((term) => term.length > 3 && term.length < 30)
        .slice(0, 5);
      symptoms.push(...medicalTerms);
    }

    // If still nothing, extract first meaningful descriptive words
    if (symptoms.length === 0) {
      const words = aiResponse
        .split(/\s+/)
        .filter(
          (word) =>
            word.length > 3 &&
            /^[a-z]+$/i.test(word) &&
            ![
              "this",
              "that",
              "with",
              "from",
              "have",
              "been",
              "there",
              "were",
            ].includes(word.toLowerCase())
        )
        .slice(0, 5);
      symptoms.push(
        ...words.map(
          (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
      );
    }
  }

  // Step 5: Remove duplicates and limit to most relevant (max 10)
  const uniqueSymptoms = [...new Set(symptoms)];
  const finalSymptoms = uniqueSymptoms.slice(0, 10);

  return finalSymptoms.length > 0 ? finalSymptoms : ["Skin condition detected"];
}

// Analyze image and extract symptoms
export const analyzeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }

    const imageBuffer = req.file.buffer;
    const imageBase64 = imageToBase64(imageBuffer);
    const mimeType = req.file.mimetype;

    // Prepare prompt for Gemini Vision API
    const prompt = `Analyze this medical image (skin condition, rash, wound, or other visible health concern). 
Describe what you see in detail, focusing on:
- Visible symptoms (redness, swelling, rash, irritation, etc.)
- Appearance characteristics (color, texture, pattern, size)
- Possible condition indicators
- Any concerning features

Provide a clear, concise medical description. If this appears to be a skin condition, mention specific symptoms like rash, redness, swelling, irritation, or allergy.`;

    // Use Gemini Vision API
    const model = genai.getGenerativeModel({ model: MODEL_ID });

    // Convert image to format expected by Gemini
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const aiText = response.text();

    // Extract symptoms from AI response
    const extractedSymptoms = extractSymptoms(aiText);

    // Return both the full AI description and extracted symptoms
    return res.status(200).json({
      success: true,
      data: {
        aiDescription: aiText,
        symptoms: extractedSymptoms,
        symptomsText: extractedSymptoms.join(", "),
      },
    });
  } catch (error) {
    console.error("Image analysis error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to analyze image",
      details: error.message,
    });
  }
};
