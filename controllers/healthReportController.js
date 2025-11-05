// controllers/healthReportController.js
import HealthReport from "../models/Health_Report.js";
import WeeklyPlanner from "../models/DietPlan.js";
import User from "../models/user_model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_ID = "gemini-2.0-flash"; // or "gemini-2.5-pro"

// Helper function to delay execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function buildCombinedPrompt({ symptomsText, type, context, dietPreference }) {
  const dietNote = dietPreference 
    ? dietPreference === 'vegetarian' 
      ? 'IMPORTANT: The user is VEGETARIAN. In FoodsToEat, recommend ONLY vegetarian foods (fruits, vegetables, grains, legumes, dairy, eggs, plant-based proteins). Do NOT include any meat, fish, or poultry.'
      : 'IMPORTANT: The user is NON-VEGETARIAN. In FoodsToEat, you can recommend both vegetarian and non-vegetarian foods (meat, fish, poultry, as well as fruits, vegetables, grains, etc.).'
    : '';

  const reportPrompt = `
You are a health analysis AI. Analyze the following symptoms and provide a structured response in JSON format.

Symptoms: "${symptomsText}"

${dietNote}

Provide comprehensive health analysis with ALL of the following fields:
1. DetectedSymptoms - List of detected symptoms (array of strings)
2. PossibleCauses - Possible causes of symptoms (array of strings)
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
15. summary - Brief summary of the analysis (string)

IMPORTANT: All array fields must contain at least 2-3 items. Do not leave any field empty.
For NutritionalDeficiencies, analyze what vitamins or minerals might be lacking.
For RecommendedMedicines, include general recommendations and note to consult a doctor.
For ExerciseRecommendations, provide specific exercise suggestions.
${dietNote}
For FoodsToEat: ${dietPreference === 'vegetarian' ? 'Recommend ONLY vegetarian foods. Include: fruits, vegetables, whole grains, legumes, nuts, seeds, dairy products, eggs, plant-based proteins. EXCLUDE: meat, fish, poultry, seafood.' : 'Recommend both vegetarian and non-vegetarian options including: lean meats, fish, poultry, eggs, dairy, fruits, vegetables, whole grains, legumes.'}

Format as valid JSON with these EXACT keys (all fields required):
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
`.trim();

  const dietInstructions = dietPreference === 'vegetarian'
    ? 'IMPORTANT: User is VEGETARIAN. In dietPlan, provide ONLY vegetarian meals. Include: vegetables, fruits, grains, legumes, dairy, eggs, tofu, tempeh, nuts, seeds. EXCLUDE: meat, fish, poultry, seafood, any animal flesh.'
    : 'IMPORTANT: User is NON-VEGETARIAN. In dietPlan, you can include both vegetarian and non-vegetarian options: lean meats (chicken, fish), eggs, dairy, vegetables, fruits, grains, legumes.';

  const plannerPrompt = `
Additionally, if requested, generate a 7-day weeklyPlanner array with entries:
[
  {
    "day": "Monday",
    "date": "YYYY-MM-DD",
    "dietPlan": {
      "breakfast": "…",
      "midMorningSnack": "…",
      "lunch": "…",
      "eveningSnack": "…",
      "dinner": "…",
      "hydration": "…"
    },
    "exercises": ["…", "…"],
    "medicines": [{ "name": "…", "note": "…" }],
    "progress": 0,
    "focusNote": "…"
  }
]
${dietInstructions}

CRITICAL: Ensure each day has DIFFERENT meals and exercises. Vary breakfast, lunch, dinner, and snacks across all 7 days. Only 1-2 items (maximum) should repeat across the week (like hydration message or basic supplement). Use different food combinations, recipes, and exercise types for each day to provide variety and prevent monotony.

Keep language supportive and general (no diagnoses). Return strictly valid JSON with keys only for what is requested by 'type' (report | planner | both).
Context (may help personalize): ${context}
`.trim();

  const header = `Return ONLY valid JSON. Do not include code fences or extra text.`;
  const wantText = type.toLowerCase();
  const footer = `Requested type: "${wantText}".    
  Return JSON only — no markdown, no explanations, no code blocks
  `;

  return [header, reportPrompt, plannerPrompt, footer].join("\n\n");
}

export const generateAnalysisController = async (req, res) => {
  try {
    const type = (req.query.type || "both").toLowerCase(); // report | planner | both
    const { userId, symptomsText, duration, severity, frequency, worseCondition, existingConditions, medications, lifestyle, dietPreference } = req.body;

    // Validate user
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }

    // Arrays normalization (optional personalization context)
    const context = JSON.stringify({
      duration,
      severity,
      frequency,
      worseCondition,
      existingConditions,
      medications,
      lifestyle,
      dietPreference: dietPreference || 'non-vegetarian' // Default to non-vegetarian if not provided
    });

    const wantReport = type === "report" || type === "both";
    const wantPlanner = type === "planner" || type === "both";

    // Build prompt and schema
    const prompt = buildCombinedPrompt({ symptomsText, type, context, dietPreference: dietPreference || 'non-vegetarian' });

    // Gemini call with strict JSON output and retry logic
    const model = genai.getGenerativeModel({
    model: MODEL_ID,
      generationConfig: {
        temperature: 0.6,
        topP: 0.9,
        responseMimeType: "application/json",
      }
    });

    // Retry logic: 3 attempts
    const MAX_RETRIES = 3;
    let lastError = null;
    let parsed = null;
    let aiText = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Attempting to get Gemini response for ${type} (Attempt ${attempt}/${MAX_RETRIES})`);
        
        const response = await model.generateContent(prompt);
        aiText = response?.response?.text?.();
        
        if (!aiText || aiText.trim() === '') {
          throw new Error("Empty response from AI");
        }

        let cleanText = aiText;

        // 1️⃣ Remove Markdown code fences and "json" tags
        cleanText = cleanText
          .replace(/```json/i, "")
          .replace(/```/g, "")
          .trim();

        // 2️⃣ Remove extra newlines and normalize whitespace
        cleanText = cleanText.replace(/\\n/g, "\n").replace(/\n+/g, "\n");

        // 3️⃣ Try to find the first valid JSON object using regex (safety)
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON object found in response");
        }
            
        // Try to parse the JSON
        try {
          parsed = JSON.parse(jsonMatch[0]);
          console.log(`Successfully got and parsed ${type} from Gemini on attempt ${attempt}`);
          break; // Success - exit retry loop
        } catch (parseError) {
          throw new Error(`Invalid JSON returned: ${parseError.message}`);
        }

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

    // Check if all retries failed
    if (!parsed) {
      console.error(`All ${MAX_RETRIES} attempts failed for ${type}. Last error:`, lastError.message);
      return res.status(500).json({ 
        error: "Failed to generate analysis. Please try again in a moment.",
        details: `Failed after ${MAX_RETRIES} attempts: ${lastError.message}` 
      });
    }

    // Persist report if requested
    const result = {};
        console.log("Parsed output keys:", Object.keys(parsed));
    if (wantReport) {
      const r = parsed.report || parsed;
      console.log("Report data:", JSON.stringify(r, null, 2));
      
      const reportDoc = {
        userId: user ? user._id.toString() : null,
        symptoms: Array.isArray(r.DetectedSymptoms) ? r.DetectedSymptoms : [],
        duration,
        severity,
        frequency,
        worseCondition,
        existingConditions,
        medications,
        lifestyle,
        dietPreference: dietPreference || 'non-vegetarian',
        summary: r.summary || "",
        causes: Array.isArray(r.PossibleCauses) ? r.PossibleCauses : [],
        deficiencies: Array.isArray(r.NutritionalDeficiencies) ? r.NutritionalDeficiencies : [],
        prevention: Array.isArray(r.PreventionTips) ? r.PreventionTips : [],
        medicines: Array.isArray(r.RecommendedMedicines) ? r.RecommendedMedicines : [],
        naturalRemedies: Array.isArray(r.NaturalRemediesAndHerbs) ? r.NaturalRemediesAndHerbs : [],
        yoga: Array.isArray(r.YogaPractices) ? r.YogaPractices : [],
        exercises: Array.isArray(r.ExerciseRecommendations) ? r.ExerciseRecommendations : [],
        cure: Array.isArray(r.CureAndTreatment) ? r.CureAndTreatment : [],
        foodsToEat: Array.isArray(r.FoodsToEat) ? r.FoodsToEat : [],
        foodsToAvoid: Array.isArray(r.FoodsToAvoid) ? r.FoodsToAvoid : [],
        thingsToFollow: Array.isArray(r.ThingsToFollow) ? r.ThingsToFollow : [],
        thingsToAvoid: Array.isArray(r.ThingsToAvoid) ? r.ThingsToAvoid : [],
        healthScore: typeof r.HealthScore === "number" ? Math.round(r.HealthScore) : 70
      };

      const savedReport = await HealthReport.create(reportDoc);
      if (user) {
        user.reports.push(savedReport._id);
        await user.save();
      }
      result.report = savedReport;
    }

    // Persist planner if requested
    if (wantPlanner && Array.isArray(parsed.weeklyPlanner)) {
      const days = parsed.weeklyPlanner.map((d, idx) => ({
        day: d.day || `Day ${idx + 1}`,
        date: d.date ? new Date(d.date) : new Date(Date.now() + idx * 86400000),
        dietPlan: d.dietPlan || {},
        exercises: Array.isArray(d.exercises) ? d.exercises : [],
        medicines: Array.isArray(d.medicines) ? d.medicines : [],
        progress: typeof d.progress === "number" ? d.progress : 0,
        focusNote: d.focusNote || ""
      }));

      const weekStart = new Date();
      const weekEnd = new Date(Date.now() + (days.length - 1) * 86400000);

      const savedPlanner = await WeeklyPlanner.create({
        user: user ? user._id : null,
        weekStart,
        weekEnd,
        days
      });

      if (user) {
        user.dietPlans.push(savedPlanner._id);
        await user.save();
      }
      result.weeklyPlanner = savedPlanner;
    }

    return res.status(200).json({
      success: true,
      message: "Gemini generation complete",
      data: result,
      rawAI: aiText
    });
  } catch (error) {
    console.error("generateAnalysisController error:", error);
    const status = error.status || 500;
    return res.status(status).json({ error: "Server error", details: error.message });
  }
};

// Get all reports for a user
export const getReportsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reports = await HealthReport.find({ userId }).sort({ date: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching reports", error: error.message });
  }
};

// Get single report by ID
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await HealthReport.findById(id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching report", error: error.message });
  }
};

// Delete a report
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await HealthReport.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Report not found" });
    res.json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting report", error: error.message });
  }
};

// Calculate average health score for a user
export const getAverageHealthScore = async (req, res) => {
  try {
    const { userId } = req.params;
    const reports = await HealthReport.find({ userId });
    if (reports.length === 0) return res.json({ success: true, averageScore: 0 });

    const total = reports.reduce((sum, r) => sum + (r.healthScore || 0), 0);
    const averageScore = Math.round(total / reports.length);

    res.json({ success: true, averageScore });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error calculating average", error: error.message });
  }
};
