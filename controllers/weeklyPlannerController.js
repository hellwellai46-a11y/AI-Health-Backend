// controllers/healthReportController.js
import HealthReport from "../models/Health_Report.js";
import WeeklyPlanner from "../models/DietPlan.js";
import User from "../models/user_model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_ID = "gemini-2.5-flash"; // or "gemini-2.5-pro"

// Helper function to delay execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function buildCombinedPrompt({ symptomsText, type, context, dietPreference }) {
  const dietNote = dietPreference 
    ? dietPreference === 'vegetarian' 
      ? 'IMPORTANT: The user is VEGETARIAN. In foodsToEat and dietPlan, recommend ONLY vegetarian foods (fruits, vegetables, grains, legumes, dairy, eggs, plant-based proteins). Do NOT include any meat, fish, or poultry.'
      : 'IMPORTANT: The user is NON-VEGETARIAN. In foodsToEat and dietPlan, you can recommend both vegetarian and non-vegetarian foods (meat, fish, poultry, as well as fruits, vegetables, grains, etc.).'
    : '';

  const reportPrompt = `
You are a health analysis AI. Analyze the following symptoms and provide a structured response in JSON format.

Symptoms: "${symptomsText}"

${dietNote}

Provide:
1. List of detected symptoms
2. Possible causes
3. Nutritional deficiencies to address
4. Prevention tips
5. Medical remedies
6. Yoga exercises
7. Foods to eat ${dietPreference === 'vegetarian' ? '(ONLY vegetarian foods)' : '(can include both vegetarian and non-vegetarian options)'}
8. Foods to avoid
9. Health score (0-100)
10. Brief summary

Format as valid JSON with these exact keys: symptoms, causes, deficiencies, prevention, remedies, yoga, foodsToEat, foodsToAvoid, healthScore, summary
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
  const footer = `Requested type: "${wantText}".`;

  return [header, reportPrompt, plannerPrompt, footer].join("\n\n");
}

// Structured response schema
function getResponseSchema({ wantReport, wantPlanner }) {
  const base = {
    type: "object",
    properties: {},
    additionalProperties: false
  };

  if (wantReport) {
    base.properties.report = {
      type: "object",
      properties: {
        symptoms: { type: "array", items: { type: "string" } },
        causes: { type: "array", items: { type: "string" } },
        deficiencies: { type: "array", items: { type: "string" } },
        prevention: { type: "array", items: { type: "string" } },
        remedies: { type: "array", items: { type: "string" } },
        yoga: { type: "array", items: { type: "string" } },
        foodsToEat: { type: "array", items: { type: "string" } },
        foodsToAvoid: { type: "array", items: { type: "string" } },
        healthScore: { type: "number" },
        summary: { type: "string" }
      },
      required: [
        "symptoms",
        "causes",
        "deficiencies",
        "prevention",
        "remedies",
        "yoga",
        "foodsToEat",
        "foodsToAvoid",
        "healthScore",
        "summary"
      ],
      additionalProperties: false
    };
  }

  if (wantPlanner) {
    base.properties.weeklyPlanner = {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string" },
          date: { type: "string" },
          dietPlan: {
            type: "object",
            properties: {
              breakfast: { type: "string" },
              midMorningSnack: { type: "string" },
              lunch: { type: "string" },
              eveningSnack: { type: "string" },
              dinner: { type: "string" },
              hydration: { type: "string" }
            },
            required: [
              "breakfast",
              "midMorningSnack",
              "lunch",
              "eveningSnack",
              "dinner",
              "hydration"
            ],
            additionalProperties: false
          },
          exercises: { type: "array", items: { type: "string" } },
          medicines: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                note: { type: "string" }
              },
              required: ["name", "note"],
              additionalProperties: false
            }
          },
          progress: { type: "number" },
          focusNote: { type: "string" }
        },
        required: ["day", "dietPlan", "exercises", "medicines", "progress", "focusNote"],
        additionalProperties: false
      }
    };
  }

  return base;
}

export const generateAnalysisController = async (req, res) => {
  try {
    const type = (req.query.type || "both").toLowerCase(); // report | planner | both
    const { userId, symptomsText, duration, severity, frequency, worseCondition, existingConditions, medications, lifestyle, dietPreference } = req.body;

    // Validate user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Arrays normalization (optional personalization context)
    const context = JSON.stringify({
      duration,
      severity,
      frequency,
      worseCondition,
      existingConditions,
      medications,
      lifestyle,
      dietPreference: dietPreference || 'non-vegetarian'
    });

    const wantReport = type === "report" || type === "both";
    const wantPlanner = type === "planner" || type === "both";

    // Build prompt and schema
    const prompt = buildCombinedPrompt({ symptomsText, type, context, dietPreference: dietPreference || 'non-vegetarian' });
    const responseSchema = getResponseSchema({ wantReport, wantPlanner });

    // Gemini call with strict JSON output and retry logic
    const model = genai.getGenerativeModel({
      model: MODEL_ID,
      generationConfig: {
        temperature: 0.6,
        topP: 0.9,
        responseMimeType: "application/json",
        responseSchema
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

        // Try to parse the JSON
        try {
          parsed = JSON.parse(aiText);
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
    if (wantReport && parsed.report) {
      const r = parsed.report;
      const reportDoc = {
        user: user._id,
        symptoms: Array.isArray(r.symptoms) ? r.symptoms : [],
        duration,
        severity,
        frequency,
        worseCondition,
        existingConditions,
        medications,
        lifestyle,
        reportSummary: r.summary || "",
        possibleCauses: Array.isArray(r.causes) ? r.causes : [],
        suggestions: Array.isArray(r.prevention) ? r.prevention.join("; ") : "",
        remedies: Array.isArray(r.remedies) ? r.remedies : [],
        yoga: Array.isArray(r.yoga) ? r.yoga : [],
        foodsToEat: Array.isArray(r.foodsToEat) ? r.foodsToEat : [],
        foodsToAvoid: Array.isArray(r.foodsToAvoid) ? r.foodsToAvoid : [],
        healthScore: typeof r.healthScore === "number" ? Math.round(r.healthScore) : 70
      };

      const savedReport = await HealthReport.create(reportDoc);
      user.healthReports.push(savedReport._id);
      await user.save();
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
        user: user._id,
        weekStart,
        weekEnd,
        days
      });

      // Add to user's dietPlans array (not weeklyPlanners)
      if (!user.dietPlans) {
        user.dietPlans = [];
      }
      user.dietPlans.push(savedPlanner._id);
      await user.save();
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

// Get all weekly planners for a user
export const getPlannersByUser = async (req, res) => {
  try {
    const userId = req.userId || req.params.userId; // Use from middleware or fallback to params

    const planners = await WeeklyPlanner.find({ user: userId })
      .sort({ createdAt: -1 }) // Most recent first
      .populate('user', 'name email')
      .lean();

    // Transform the data to match frontend expectations
    const transformedPlanners = planners.map((planner) => ({
      _id: planner._id,
      id: planner._id.toString(),
      userId: planner.user?._id?.toString() || planner.user?.toString() || userId,
      createdDate: planner.createdAt || planner.weekStart || new Date().toISOString(),
      weekStart: planner.weekStart,
      weekEnd: planner.weekEnd,
      weekPlan: planner.days?.map((day) => ({
        day: day.day || '',
        date: day.date ? new Date(day.date).toISOString() : new Date().toISOString(),
        diet: day.dietPlan || {},
        exercises: Array.isArray(day.exercises) ? day.exercises : [],
        medicines: Array.isArray(day.medicines) ? day.medicines : [],
        notes: day.focusNote || '',
        progress: day.progress || 0
      })) || []
    }));

    res.status(200).json({
      success: true,
      count: transformedPlanners.length,
      data: transformedPlanners
    });
  } catch (error) {
    console.error("Get planners by user error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a single weekly planner by ID
export const getPlannerById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId; // From middleware

    const planner = await WeeklyPlanner.findById(id)
      .populate('user', 'name email')
      .lean();

    if (!planner) {
      return res.status(404).json({ success: false, error: "Planner not found" });
    }

    // Check if planner belongs to user
    const plannerUserId = planner.user?._id?.toString() || planner.user?.toString();
    if (userId && plannerUserId !== userId) {
      return res.status(403).json({ success: false, error: "Unauthorized access" });
    }

    // Transform the data
    const transformedPlanner = {
      _id: planner._id,
      id: planner._id.toString(),
      userId: plannerUserId || '',
      createdDate: planner.createdAt || planner.weekStart || new Date().toISOString(),
      weekStart: planner.weekStart,
      weekEnd: planner.weekEnd,
      weekPlan: planner.days?.map((day) => ({
        day: day.day || '',
        date: day.date ? new Date(day.date).toISOString() : new Date().toISOString(),
        diet: day.dietPlan || {},
        exercises: Array.isArray(day.exercises) ? day.exercises : [],
        medicines: Array.isArray(day.medicines) ? day.medicines : [],
        notes: day.focusNote || '',
        progress: day.progress || 0
      })) || []
    };

    res.status(200).json({
      success: true,
      data: transformedPlanner
    });
  } catch (error) {
    console.error("Get planner by ID error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
