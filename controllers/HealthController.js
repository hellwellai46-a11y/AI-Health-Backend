import axios from "axios";
import HealthReport from "../models/Health_Report.js";
import User from "../models/user_model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  extractAndNormalizeSymptoms,
  validateSymptoms,
} from "../services/symptomNormalizer.js";
import "dotenv/config";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_ID = "gemini-1.5-flash"; // Stable Gemini model
const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";

// Helper function to delay execution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate health analysis with ML disease prediction
 * This combines ML model predictions with Gemini AI for comprehensive analysis
 */
export const generateHealthAnalysisWithML = async (req, res) => {
  try {
    const {
      userId,
      symptoms, // Array of symptom strings
      duration,
      severity,
      frequency,
      worseCondition,
      existingConditions,
      medications,
      lifestyle,
      dietPreference,
    } = req.body;

    // Validate symptoms
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        error:
          "Symptoms array is required and must contain at least one symptom",
      });
    }

    // Step 1: Get ML disease prediction
    console.log("🔬 Calling ML API for disease prediction...");
    let mlPrediction = null;
    try {
      const mlResponse = await axios.post(`${ML_API_URL}/predict`, {
        symptoms,
        metadata: { userId },
      });
      mlPrediction = mlResponse.data;
      console.log("✅ ML Prediction received:", mlPrediction.predicted_disease);
    } catch (mlError) {
      console.error("⚠️ ML API error:", mlError.message);
      // Continue without ML prediction if API fails
      mlPrediction = {
        success: false,
        error: "ML prediction unavailable",
        predicted_disease: null,
      };
    }

    // Step 2: Build enhanced prompt with ML prediction
    const dietNote =
      dietPreference === "vegetarian"
        ? "IMPORTANT: The user is VEGETARIAN. In FoodsToEat, recommend ONLY vegetarian foods (fruits, vegetables, grains, legumes, dairy, eggs, plant-based proteins). Do NOT include any meat, fish, or poultry."
        : "IMPORTANT: The user is NON-VEGETARIAN. In FoodsToEat, you can recommend both vegetarian and non-vegetarian foods (meat, fish, poultry, as well as fruits, vegetables, grains, etc.)";

    const mlInfo = mlPrediction.predicted_disease
      ? `\n\nML MODEL PREDICTION:
- Predicted Disease: ${mlPrediction.predicted_disease}
- Confidence: ${
          mlPrediction.confidence
            ? (mlPrediction.confidence * 100).toFixed(1) + "%"
            : "N/A"
        }
- Extracted Symptoms: ${mlPrediction.extracted_symptoms?.join(", ") || "N/A"}
- Urgency Level: ${mlPrediction.urgency_flag?.level || "N/A"}
- Recommended Action: ${
          mlPrediction.urgency_flag?.recommended_action ||
          "Consult a healthcare professional"
        }
${
  mlPrediction.precautions && mlPrediction.precautions.length > 0
    ? "\n- ML Recommended Precautions:\n  * " +
      mlPrediction.precautions.join("\n  * ")
    : ""
}

Please incorporate this ML prediction and its precautions into your analysis. Consider the ML-provided precautions when generating PreventionTips and ThingsToFollow. Provide comprehensive health recommendations based on both the ML model's prediction and your medical knowledge.`
      : "\n\nNote: ML prediction is currently unavailable. Please provide analysis based on the symptoms provided.";

    const prompt = `
You are a health analysis AI. Analyze the following symptoms and provide a structured response in JSON format.

User Symptoms: ${symptoms.join(", ")}
${mlInfo}

Additional Context:
- Duration: ${duration || "Not specified"}
- Severity: ${severity || "Not specified"}
- Frequency: ${frequency || "Not specified"}
- Worse Condition: ${worseCondition || "Not specified"}
- Existing Conditions: ${existingConditions?.join(", ") || "None"}
- Current Medications: ${medications?.join(", ") || "None"}
- Lifestyle: ${JSON.stringify(lifestyle || {})}
- Diet Preference: ${dietPreference || "Non-vegetarian"}

${dietNote}

Provide comprehensive health analysis with ALL of the following fields:
1. DetectedSymptoms - List of detected symptoms (array of strings)
2. PossibleCauses - Possible causes of symptoms, considering the ML prediction if available (array of strings)
3. NutritionalDeficiencies - Nutritional deficiencies to address (array of strings)
4. PreventionTips - Prevention tips and recommendations (array of strings)
5. RecommendedMedicines - Recommended medicines or supplements (array of strings, include general recommendations like "Consult doctor for prescription medications")
6. YogaPractices - Yoga practices and poses (array of strings)
7. FoodsToEat - Foods to eat (array of strings)
8. FoodsToAvoid - Foods to avoid (array of strings)
9. ExerciseRecommendations - Exercise recommendations (array of strings)
10. ThingsToFollow - Things to follow or do (array of strings)
11. ThingsToAvoid - Things to avoid or not do (array of strings)
12. NaturalRemediesAndHerbs - Natural remedies and herbs (array of strings)
13. CureAndTreatment - Cure and treatment recommendations (array of strings)
14. HealthScore - Health score from 0-100 (number)
15. summary - Brief summary of the analysis including the ML prediction if available (string)

IMPORTANT: All array fields must contain at least 2-3 items. Do not leave any field empty.
${
  dietPreference === "vegetarian"
    ? "For FoodsToEat: Recommend ONLY vegetarian foods. Include: fruits, vegetables, whole grains, legumes, nuts, seeds, dairy products, eggs, plant-based proteins. EXCLUDE: meat, fish, poultry, seafood."
    : "For FoodsToEat: Recommend both vegetarian and non-vegetarian options including: lean meats, fish, poultry, eggs, dairy, fruits, vegetables, whole grains, legumes."
}

Return ONLY valid JSON with these EXACT keys (all fields required):
{
  "DetectedSymptoms": ["symptom1", "symptom2"],
  "PossibleCauses": ["cause1", "cause2"],
  "NutritionalDeficiencies": ["deficiency1", "deficiency2"],
  "PreventionTips": ["tip1", "tip2"],
  "RecommendedMedicines": ["medicine1", "medicine2"],
  "YogaPractices": ["yoga1", "yoga2"],
  "FoodsToEat": ["food1", "food2"],
  "FoodsToAvoid": ["food1", "food2"],
  "ExerciseRecommendations": ["exercise1", "exercise2"],
  "ThingsToFollow": ["thing1", "thing2"],
  "ThingsToAvoid": ["thing1", "thing2"],
  "NaturalRemediesAndHerbs": ["remedy1", "remedy2"],
  "CureAndTreatment": ["treatment1", "treatment2"],
  "HealthScore": 75,
  "summary": "Brief summary here"
}

Do not include code fences or extra text. Return only the JSON object.
`.trim();

    // Step 3: Call Gemini AI with retry logic
    const model = genai.getGenerativeModel({
      model: MODEL_ID,
      generationConfig: {
        temperature: 0.6,
        topP: 0.9,
        responseMimeType: "application/json",
      },
    });

    const MAX_RETRIES = 3;
    let lastError = null;
    let parsed = null;
    let aiText = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🤖 Calling Gemini AI (Attempt ${attempt}/${MAX_RETRIES})`);

        const response = await model.generateContent(prompt);
        aiText = response?.response?.text?.();

        if (!aiText || aiText.trim() === "") {
          throw new Error("Empty response from AI");
        }

        let cleanText = aiText;
        cleanText = cleanText
          .replace(/```json/i, "")
          .replace(/```/g, "")
          .trim();
        cleanText = cleanText.replace(/\\n/g, "\n").replace(/\n+/g, "\n");

        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON object found in response");
        }

        parsed = JSON.parse(jsonMatch[0]);
        console.log(
          `✅ Successfully parsed Gemini response on attempt ${attempt}`
        );
        break;
      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed:`, error.message);

        if (attempt < MAX_RETRIES) {
          const delay = attempt * 1000;
          console.log(`⏳ Retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }

    if (!parsed) {
      console.error(
        `❌ All ${MAX_RETRIES} attempts failed. Last error:`,
        lastError.message
      );
      return res.status(500).json({
        success: false,
        error: "Failed to generate analysis. Please try again in a moment.",
        details: `Failed after ${MAX_RETRIES} attempts: ${lastError.message}`,
      });
    }

    // Step 4: Validate user
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }

    // Step 5: Create and save health report
    const reportDoc = {
      userId: user ? user._id.toString() : null,
      symptoms: Array.isArray(parsed.DetectedSymptoms)
        ? parsed.DetectedSymptoms
        : symptoms,
      duration,
      severity,
      frequency,
      worseCondition,
      existingConditions,
      medications,
      lifestyle,
      dietPreference: dietPreference || "non-vegetarian",
      summary: parsed.summary || "",
      causes: Array.isArray(parsed.PossibleCauses) ? parsed.PossibleCauses : [],
      deficiencies: Array.isArray(parsed.NutritionalDeficiencies)
        ? parsed.NutritionalDeficiencies
        : [],
      prevention: Array.isArray(parsed.PreventionTips)
        ? parsed.PreventionTips
        : [],
      medicines: Array.isArray(parsed.RecommendedMedicines)
        ? parsed.RecommendedMedicines
        : [],
      naturalRemedies: Array.isArray(parsed.NaturalRemediesAndHerbs)
        ? parsed.NaturalRemediesAndHerbs
        : [],
      yoga: Array.isArray(parsed.YogaPractices) ? parsed.YogaPractices : [],
      exercises: Array.isArray(parsed.ExerciseRecommendations)
        ? parsed.ExerciseRecommendations
        : [],
      cure: Array.isArray(parsed.CureAndTreatment)
        ? parsed.CureAndTreatment
        : [],
      foodsToEat: Array.isArray(parsed.FoodsToEat) ? parsed.FoodsToEat : [],
      foodsToAvoid: Array.isArray(parsed.FoodsToAvoid)
        ? parsed.FoodsToAvoid
        : [],
      thingsToFollow: Array.isArray(parsed.ThingsToFollow)
        ? parsed.ThingsToFollow
        : [],
      thingsToAvoid: Array.isArray(parsed.ThingsToAvoid)
        ? parsed.ThingsToAvoid
        : [],
      healthScore:
        typeof parsed.HealthScore === "number"
          ? Math.round(parsed.HealthScore)
          : 70,
      // Store ML prediction data
      mlPrediction: mlPrediction.predicted_disease
        ? {
            disease: mlPrediction.predicted_disease,
            confidence: mlPrediction.confidence,
            urgencyLevel: mlPrediction.urgency_flag?.level,
            urgencyReason: mlPrediction.urgency_flag?.reason,
            recommendedAction: mlPrediction.urgency_flag?.recommended_action,
            precautions: Array.isArray(mlPrediction.precautions)
              ? mlPrediction.precautions
              : [],
            topPredictions: mlPrediction.top_k || [],
          }
        : null,
    };

    const savedReport = await HealthReport.create(reportDoc);

    if (user) {
      user.reports.push(savedReport._id);
      await user.save();
    }

    // Step 6: Return combined response
    return res.status(200).json({
      success: true,
      message: "Health analysis generated successfully",
      data: {
        report: savedReport,
        mlPrediction: mlPrediction.predicted_disease ? mlPrediction : null,
      },
    });
  } catch (error) {
    console.error("❌ generateHealthAnalysisWithML error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      details: error.message,
    });
  }
};

/**
 * Get disease prediction only (without full health analysis)
 */
export const predictDisease = async (req, res) => {
  try {
    const { symptoms, metadata } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        error:
          "Symptoms array is required and must contain at least one symptom",
      });
    }

    // Call ML API
    const mlResponse = await axios.post(`${ML_API_URL}/predict`, {
      symptoms,
      metadata: metadata || {},
    });

    return res.status(200).json({
      success: true,
      data: mlResponse.data,
    });
  } catch (error) {
    console.error("❌ Disease prediction error:", error.message);

    if (error.response?.status === 503) {
      return res.status(503).json({
        success: false,
        error: "ML API model not loaded",
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || "Disease prediction failed",
    });
  }
};

/**
 * Check ML API health status
 */
export const checkMLHealth = async (req, res) => {
  try {
    const response = await axios.get(`${ML_API_URL}/health`);
    return res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("❌ ML API health check failed:", error.message);
    return res.status(503).json({
      success: false,
      error: "ML API is not available",
      details: error.message,
    });
  }
};

// ✅ Create report (from frontend analysis or backend AI)
export const createReport = async (req, res) => {
  try {
    const report = new HealthReport(req.body);
    await report.save();
    res.status(201).json(report);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating report", error: error.message });
  }
};

// ✅ Get all reports for a user
export const getReportsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reports = await HealthReport.find({ userId }).sort({ date: -1 });
    res.json(reports);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching reports", error: error.message });
  }
};

// ✅ Get single report by ID
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await HealthReport.findById(id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json(report);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching report", error: error.message });
  }
};

// ✅ Delete a report
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await HealthReport.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Report not found" });
    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting report", error: error.message });
  }
};

// ✅ Calculate average health score for a user
export const getAverageHealthScore = async (req, res) => {
  try {
    const { userId } = req.params;
    const reports = await HealthReport.find({ userId });
    if (reports.length === 0) return res.json({ averageScore: 0 });

    const total = reports.reduce((sum, r) => sum + r.healthScore, 0);
    const averageScore = Math.round(total / reports.length);

    res.json({ averageScore });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error calculating average", error: error.message });
  }
};
