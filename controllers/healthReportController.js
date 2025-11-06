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

// Helper function to check if a food item contains non-vegetarian ingredients
const containsNonVegetarian = (foodItem) => {
  if (!foodItem || typeof foodItem !== 'string') return false;
  
  const lowerFood = foodItem.toLowerCase();
  
  // List of non-vegetarian keywords
  const nonVegKeywords = [
    'chicken', 'beef', 'pork', 'lamb', 'mutton', 'goat', 'turkey', 'duck', 'quail',
    'fish', 'salmon', 'tuna', 'cod', 'sardine', 'mackerel', 'prawn', 'shrimp', 'crab',
    'lobster', 'seafood', 'meat', 'poultry', 'bacon', 'ham', 'sausage', 'pepperoni',
    'gelatin', 'fish sauce', 'oyster sauce', 'anchovy', 'squid', 'octopus', 'mussel',
    'clam', 'scallop', 'caviar', 'roe', 'stock', 'broth', 'bone broth', 'animal flesh'
  ];
  
  return nonVegKeywords.some(keyword => lowerFood.includes(keyword));
};

// Helper function to filter non-vegetarian items from arrays
const filterVegetarianItems = (items, isVegetarian) => {
  if (!isVegetarian || !Array.isArray(items)) return items;
  
  return items.filter(item => {
    if (typeof item === 'string') {
      return !containsNonVegetarian(item);
    }
    // For objects (like dietPlan meals), check the value
    if (typeof item === 'object' && item !== null) {
      // If it's a meal object with string values, check each value
      return Object.values(item).every(value => {
        if (typeof value === 'string') {
          return !containsNonVegetarian(value);
        }
        return true;
      });
    }
    return true;
  });
};

// Helper function to filter non-vegetarian items from diet plan
const filterVegetarianDietPlan = (dietPlan, isVegetarian) => {
  if (!isVegetarian || !dietPlan || typeof dietPlan !== 'object') return dietPlan;
  
  const filtered = {};
  for (const [key, value] of Object.entries(dietPlan)) {
    if (typeof value === 'string') {
      if (!containsNonVegetarian(value)) {
        filtered[key] = value;
      } else {
        // Replace with a vegetarian alternative message
        filtered[key] = 'Vegetarian meal (please specify based on your preferences)';
      }
    } else {
      filtered[key] = value;
    }
  }
  return filtered;
};

function buildCombinedPrompt({ symptomsText, type, context, dietPreference }) {
  const isVegetarian = dietPreference === 'vegetarian';
  
  const dietNote = dietPreference 
    ? isVegetarian
      ? `🚨 CRITICAL DIETARY RESTRICTION - STRICTLY ENFORCE: 
The user is VEGETARIAN. This is a STRICT requirement that MUST be followed without exception.

FOR FoodsToEat field:
- MUST ONLY recommend vegetarian foods
- ALLOWED: fruits, vegetables, whole grains, legumes, nuts, seeds, dairy products, eggs, plant-based proteins (tofu, tempeh, seitan), plant-based milk
- ABSOLUTELY FORBIDDEN: meat (beef, pork, lamb, etc.), fish, seafood, poultry (chicken, turkey, duck), any animal flesh, gelatin, fish sauce, meat-based broths
- DOUBLE-CHECK: Before adding any food item, verify it contains NO meat, fish, poultry, or seafood
- If a food item could be ambiguous, choose a clearly vegetarian alternative

This restriction applies to ALL food recommendations in the FoodsToEat array.`
      : `DIETARY PREFERENCE:
The user is NON-VEGETARIAN. 

FOR FoodsToEat field:
- You CAN recommend BOTH vegetarian AND non-vegetarian foods
- ALLOWED: All vegetarian foods (fruits, vegetables, grains, legumes, dairy, eggs) PLUS lean meats (chicken, fish, turkey), seafood, eggs, and other animal proteins
- You have flexibility to include a mix of both types based on nutritional needs
- Balance the recommendations with both plant-based and animal-based protein sources`
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

🚨 STRICT FOOD RECOMMENDATION RULES FOR FoodsToEat ARRAY:
${isVegetarian 
  ? `VEGETARIAN USER - ABSOLUTE RESTRICTION:
- MUST ONLY include vegetarian foods in the FoodsToEat array
- ALLOWED ITEMS: Fruits (all types), Vegetables (all types), Whole grains (rice, wheat, oats, quinoa), Legumes (beans, lentils, chickpeas), Nuts and seeds, Dairy products (milk, cheese, yogurt), Eggs, Plant-based proteins (tofu, tempeh, seitan, plant-based meat alternatives), Plant-based milk
- FORBIDDEN ITEMS: Any meat (beef, pork, lamb, mutton, etc.), Any fish or seafood, Any poultry (chicken, turkey, duck, etc.), Any animal flesh, Gelatin, Fish sauce, Meat-based broths or stocks
- VALIDATION: Before finalizing the FoodsToEat array, review each item to ensure it contains NO animal flesh or by-products
- If unsure about any food item, choose a clearly vegetarian alternative
- Example CORRECT items: "Dal (lentils)", "Paneer curry", "Vegetable biryani", "Tofu stir-fry", "Greek yogurt"
- Example FORBIDDEN items: "Chicken curry", "Fish curry", "Beef stew", "Prawn biryani" - DO NOT include these`
  : `NON-VEGETARIAN USER - FLEXIBLE OPTIONS:
- You CAN include BOTH vegetarian and non-vegetarian foods in the FoodsToEat array
- ALLOWED ITEMS: All vegetarian foods (fruits, vegetables, grains, legumes, dairy, eggs) PLUS lean meats (chicken, fish, turkey), seafood, eggs, and other animal proteins
- You have the flexibility to recommend a balanced mix of both types
- Include a variety of protein sources from both plant and animal sources
- Example items: "Grilled chicken", "Fish curry", "Dal (lentils)", "Paneer curry", "Egg curry", "Vegetable stir-fry"`}

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

  const dietInstructions = isVegetarian
    ? `🚨 CRITICAL DIETARY RESTRICTION FOR DIET PLAN - STRICTLY ENFORCE:
The user is VEGETARIAN. This is a STRICT requirement that MUST be followed for ALL meals in the dietPlan.

FOR EACH MEAL (breakfast, midMorningSnack, lunch, eveningSnack, dinner) in the dietPlan:
- MUST ONLY provide vegetarian meals
- ALLOWED INGREDIENTS: Vegetables (all types), Fruits (all types), Grains (rice, wheat, oats, quinoa, millet), Legumes (beans, lentils, chickpeas, black beans), Dairy products (milk, cheese, yogurt, paneer, ghee), Eggs, Tofu, Tempeh, Seitan, Nuts (almonds, walnuts, cashews), Seeds (chia, flax, sunflower), Plant-based proteins, Plant-based milk
- ABSOLUTELY FORBIDDEN: Meat (beef, pork, lamb, mutton, goat), Fish (any type), Seafood (shrimp, prawns, crab, lobster), Poultry (chicken, turkey, duck, quail), Any animal flesh, Gelatin, Fish sauce, Meat-based broths, Animal-based stocks
- VALIDATION CHECK: Before finalizing each meal description, verify it contains NO meat, fish, poultry, or seafood
- If a meal could be ambiguous, choose a clearly vegetarian alternative
- Example CORRECT meals: "Dal and rice with vegetables", "Paneer curry with roti", "Vegetable biryani", "Tofu stir-fry with quinoa", "Scrambled eggs with toast", "Greek yogurt with fruits"
- Example FORBIDDEN meals: "Chicken curry with rice", "Fish curry", "Beef stew", "Prawn biryani", "Mutton curry" - DO NOT include these

This restriction applies to ALL 7 days of the weekly planner. Every single meal must be vegetarian.`
    : `DIETARY PREFERENCE FOR DIET PLAN:
The user is NON-VEGETARIAN.

FOR EACH MEAL (breakfast, midMorningSnack, lunch, eveningSnack, dinner) in the dietPlan:
- You CAN include BOTH vegetarian and non-vegetarian meals
- ALLOWED: All vegetarian meals (dal, vegetables, grains, legumes, dairy, eggs) PLUS non-vegetarian meals (lean meats like chicken, fish, turkey, eggs, seafood)
- You have flexibility to mix both types throughout the week
- Include a balanced variety of both vegetarian and non-vegetarian options
- Example meals: "Grilled chicken with vegetables", "Dal and rice", "Fish curry with rice", "Paneer curry", "Egg curry with roti", "Vegetable stir-fry"`;

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

    // Post-process validation: Filter non-vegetarian items if user is vegetarian
    const currentDietPreference = dietPreference || 'non-vegetarian';
    const isVegetarian = currentDietPreference === 'vegetarian';
    
    if (isVegetarian && parsed) {
      // Filter FoodsToEat array
      if (parsed.FoodsToEat && Array.isArray(parsed.FoodsToEat)) {
        const originalLength = parsed.FoodsToEat.length;
        parsed.FoodsToEat = filterVegetarianItems(parsed.FoodsToEat, true);
        if (parsed.FoodsToEat.length < originalLength) {
          console.warn(`Filtered out ${originalLength - parsed.FoodsToEat.length} non-vegetarian items from FoodsToEat`);
        }
      }
      
      // Filter weeklyPlanner diet plans
      if (parsed.weeklyPlanner && Array.isArray(parsed.weeklyPlanner)) {
        parsed.weeklyPlanner = parsed.weeklyPlanner.map(day => {
          if (day.dietPlan) {
            day.dietPlan = filterVegetarianDietPlan(day.dietPlan, true);
          }
          return day;
        });
        console.log('Filtered non-vegetarian items from weekly planner diet plans');
      }
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
