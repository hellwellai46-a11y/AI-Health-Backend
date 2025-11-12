import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_ID = "gemini-2.0-flash";

// Helper function to delay execution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const chatWithAI = async (req, res) => {
  try {
    const { message, userId, language = "en" } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    // Determine response language
    const responseLanguage = language === "hi" ? "Hindi (हिंदी)" : "English";
    const languageNote =
      language === "hi"
        ? "IMPORTANT: You must respond ONLY in Hindi (हिंदी). Use Devanagari script for all Hindi text."
        : "IMPORTANT: Respond in English only.";

    // System prompt for health assistant
    const systemPrompt = `You are a helpful and professional AI Health Assistant. Your role is to provide:
- Health-related information and general wellness advice
- Dietary recommendations
- Exercise and yoga suggestions
- Stress management tips
- Sleep improvement advice
- Symptom guidance (with appropriate disclaimers)

IMPORTANT GUIDELINES:
1. Always remind users to consult healthcare professionals for serious medical concerns
2. Never provide medical diagnoses - only general information and advice
3. Be empathetic, supportive, and clear in your responses
4. Provide practical, actionable advice when possible
5. If asked about specific symptoms like fever, provide helpful information about general management but emphasize consulting a doctor if symptoms persist or worsen
6. Do not answer questions outside the health and wellness domain and avoid answering personal questions and sensitive topics other than health.
${languageNote} 
Respond in a friendly, conversational manner. Keep responses concise but informative (2-4 paragraphs max).`;

    // Combine system prompt with user message
    const fullPrompt = `${systemPrompt}\n\nUser question: ${message}\n\nProvide a helpful response:`;

    const model = genai.getGenerativeModel({
      model: MODEL_ID,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    // Retry logic: 3 attempts
    const MAX_RETRIES = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(
          `Attempting to get Gemini response (Attempt ${attempt}/${MAX_RETRIES})`
        );

        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        const text = response.text();

        if (!text || text.trim() === "") {
          throw new Error("Empty response from AI");
        }

        // Success - return the response
        console.log(
          `Successfully got response from Gemini on attempt ${attempt}`
        );
        return res.status(200).json({
          success: true,
          message: text,
        });
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error.message);

        // If this is not the last attempt, wait before retrying
        if (attempt < MAX_RETRIES) {
          const delay = attempt * 1000; // Exponential backoff: 1s, 2s
          console.log(`Retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }

    // All retries failed
    console.error("All 3 attempts failed. Last error:", lastError.message);

    return res.status(500).json({
      success: false,
      error:
        "I'm sorry, I'm having trouble processing your request. Please try again in a moment.",
      details: `Failed after ${MAX_RETRIES} attempts: ${lastError.message}`,
    });
  } catch (error) {
    console.error("Chatbot error (non-Gemini error):", error);
    res.status(500).json({
      success: false,
      error: "Failed to process chat message",
      details: error.message,
    });
  }
};
