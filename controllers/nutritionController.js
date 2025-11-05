import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_ID = "gemini-2.0-flash"; // or "gemini-2.5-pro"

// Helper function to delay execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Nutrition database for common Indian and international foods (fallback)
const nutritionDatabase = {
  // Roti/Chapati/Bread
  'chapati': { protein: 3.0, carbs: 15.0, fats: 0.5, calories: 75, fiber: 2.0, sodium: 150, calcium: 10, iron: 0.5 },
  'roti': { protein: 3.0, carbs: 15.0, fats: 0.5, calories: 75, fiber: 2.0, sodium: 150, calcium: 10, iron: 0.5 },
  'bread': { protein: 2.7, carbs: 13.0, fats: 1.1, calories: 75, fiber: 1.0, sodium: 150, calcium: 30, iron: 0.9 },
  'white bread': { protein: 2.7, carbs: 13.0, fats: 1.1, calories: 75, fiber: 0.5, sodium: 150, calcium: 30, iron: 0.9 },
  'brown bread': { protein: 3.0, carbs: 11.0, fats: 1.0, calories: 70, fiber: 2.5, sodium: 140, calcium: 35, iron: 1.0 },
  
  // Daal/Lentils
  'daal': { protein: 7.0, carbs: 20.0, fats: 0.4, calories: 110, fiber: 8.0, sodium: 400, calcium: 20, iron: 2.5 },
  'dal': { protein: 7.0, carbs: 20.0, fats: 0.4, calories: 110, fiber: 8.0, sodium: 400, calcium: 20, iron: 2.5 },
  'lentil': { protein: 7.0, carbs: 20.0, fats: 0.4, calories: 110, fiber: 8.0, sodium: 400, calcium: 20, iron: 2.5 },
  'lentils': { protein: 7.0, carbs: 20.0, fats: 0.4, calories: 110, fiber: 8.0, sodium: 400, calcium: 20, iron: 2.5 },
  'toor dal': { protein: 7.5, carbs: 19.0, fats: 0.5, calories: 112, fiber: 7.5, sodium: 380, calcium: 22, iron: 2.8 },
  'moong dal': { protein: 7.2, carbs: 21.0, fats: 0.3, calories: 108, fiber: 8.5, sodium: 350, calcium: 18, iron: 2.3 },
  'masoor dal': { protein: 7.8, carbs: 19.5, fats: 0.4, calories: 111, fiber: 7.8, sodium: 370, calcium: 20, iron: 2.6 },
  
  // Paneer/Cheese
  'paneer': { protein: 18.0, carbs: 2.0, fats: 20.0, calories: 265, fiber: 0, sodium: 15, calcium: 200, iron: 0.2 },
  'panner': { protein: 18.0, carbs: 2.0, fats: 20.0, calories: 265, fiber: 0, sodium: 15, calcium: 200, iron: 0.2 },
  'cheese': { protein: 7.0, carbs: 1.0, fats: 6.0, calories: 100, fiber: 0, sodium: 180, calcium: 150, iron: 0.1 },
  
  // Rice
  'rice': { protein: 2.7, carbs: 28.0, fats: 0.3, calories: 130, fiber: 0.4, sodium: 5, calcium: 16, iron: 0.8 },
  'white rice': { protein: 2.7, carbs: 28.0, fats: 0.3, calories: 130, fiber: 0.4, sodium: 5, calcium: 16, iron: 0.8 },
  'brown rice': { protein: 2.6, carbs: 22.0, fats: 0.9, calories: 112, fiber: 1.8, sodium: 5, calcium: 20, iron: 0.8 },
  
  // Vegetables
  'potato': { protein: 2.0, carbs: 17.0, fats: 0.1, calories: 77, fiber: 2.2, sodium: 6, calcium: 12, iron: 0.8, vitaminC: 19.7 },
  'onion': { protein: 1.1, carbs: 9.0, fats: 0.1, calories: 40, fiber: 1.7, sodium: 4, calcium: 23, iron: 0.2, vitaminC: 7.4 },
  'tomato': { protein: 0.9, carbs: 3.9, fats: 0.2, calories: 18, fiber: 1.2, sodium: 5, calcium: 10, iron: 0.3, vitaminC: 13.7 },
  'spinach': { protein: 2.9, carbs: 3.6, fats: 0.4, calories: 23, fiber: 2.2, sodium: 79, calcium: 99, iron: 2.7, vitaminC: 28.1 },
  'cauliflower': { protein: 1.9, carbs: 5.0, fats: 0.3, calories: 25, fiber: 2.0, sodium: 30, calcium: 22, iron: 0.4, vitaminC: 48.2 },
  'cabbage': { protein: 1.3, carbs: 5.8, fats: 0.1, calories: 25, fiber: 2.5, sodium: 18, calcium: 40, iron: 0.5, vitaminC: 36.6 },
  'carrot': { protein: 0.9, carbs: 9.6, fats: 0.2, calories: 41, fiber: 2.8, sodium: 69, calcium: 33, iron: 0.3, vitaminC: 5.9 },
  'cucumber': { protein: 0.7, carbs: 3.6, fats: 0.1, calories: 16, fiber: 0.5, sodium: 2, calcium: 16, iron: 0.3, vitaminC: 2.8 },
  'brinjal': { protein: 1.0, carbs: 5.9, fats: 0.2, calories: 25, fiber: 3.0, sodium: 2, calcium: 9, iron: 0.2, vitaminC: 2.2 },
  'eggplant': { protein: 1.0, carbs: 5.9, fats: 0.2, calories: 25, fiber: 3.0, sodium: 2, calcium: 9, iron: 0.2, vitaminC: 2.2 },
  'okra': { protein: 2.0, carbs: 7.0, fats: 0.2, calories: 33, fiber: 3.2, sodium: 7, calcium: 82, iron: 0.6, vitaminC: 23 },
  'ladyfinger': { protein: 2.0, carbs: 7.0, fats: 0.2, calories: 33, fiber: 3.2, sodium: 7, calcium: 82, iron: 0.6, vitaminC: 23 },
  
  // Fruits
  'apple': { protein: 0.3, carbs: 14.0, fats: 0.2, calories: 52, fiber: 2.4, sodium: 1, calcium: 6, iron: 0.1, vitaminC: 4.6 },
  'banana': { protein: 1.1, carbs: 23.0, fats: 0.3, calories: 89, fiber: 2.6, sodium: 1, calcium: 5, iron: 0.3, vitaminC: 8.7 },
  'orange': { protein: 0.9, carbs: 12.0, fats: 0.1, calories: 47, fiber: 2.4, sodium: 0, calcium: 40, iron: 0.1, vitaminC: 53.2 },
  'mango': { protein: 0.8, carbs: 15.0, fats: 0.4, calories: 60, fiber: 1.6, sodium: 1, calcium: 11, iron: 0.2, vitaminC: 36.4 },
  
  // Dairy
  'milk': { protein: 3.2, carbs: 4.8, fats: 3.3, calories: 61, fiber: 0, sodium: 44, calcium: 113, iron: 0.0, vitaminC: 0 },
  'yogurt': { protein: 3.5, carbs: 4.7, fats: 3.3, calories: 59, fiber: 0, sodium: 36, calcium: 110, iron: 0.1, vitaminC: 0 },
  'curd': { protein: 3.5, carbs: 4.7, fats: 3.3, calories: 59, fiber: 0, sodium: 36, calcium: 110, iron: 0.1, vitaminC: 0 },
  
  // Eggs
  'egg': { protein: 6.0, carbs: 0.6, fats: 5.0, calories: 68, fiber: 0, sodium: 62, calcium: 28, iron: 0.9, vitaminC: 0 },
  'eggs': { protein: 6.0, carbs: 0.6, fats: 5.0, calories: 68, fiber: 0, sodium: 62, calcium: 28, iron: 0.9, vitaminC: 0 },
  
  // Chicken/Fish
  'chicken': { protein: 27.0, carbs: 0, fats: 3.6, calories: 165, fiber: 0, sodium: 74, calcium: 15, iron: 1.0, vitaminC: 0 },
  'fish': { protein: 22.0, carbs: 0, fats: 12.0, calories: 206, fiber: 0, sodium: 61, calcium: 12, iron: 0.3, vitaminC: 0 },
  
  // Oils/Ghee
  'oil': { protein: 0, carbs: 0, fats: 13.6, calories: 120, fiber: 0, sodium: 0, calcium: 0, iron: 0, vitaminC: 0 },
  'ghee': { protein: 0, carbs: 0, fats: 13.6, calories: 120, fiber: 0, sodium: 0, calcium: 0, iron: 0, vitaminC: 0 },
  'butter': { protein: 0.1, carbs: 0.1, fats: 11.5, calories: 102, fiber: 0, sodium: 1, calcium: 3, iron: 0, vitaminC: 0 },
};

// Unit conversions
const unitConversions = {
  'cup': 1.0,
  'cups': 1.0,
  'gm': 1.0 / 100, // grams to 100g
  'g': 1.0 / 100,
  'gram': 1.0 / 100,
  'grams': 1.0 / 100,
  'kg': 10.0,
  'piece': 1.0,
  'pieces': 1.0,
  'pcs': 1.0,
  'pc': 1.0,
  'slice': 1.0,
  'slices': 1.0,
  'tbsp': 0.067, // tablespoon (approximately 15ml)
  'tsp': 0.033, // teaspoon (approximately 5ml)
  'ml': 1.0 / 1000, // milliliter to liter approximation
};

// Function to parse food input
function parseFoodInput(input) {
  const items = [];
  const foodItems = input.split(',').map(item => item.trim());
  
  for (const item of foodItems) {
    // Extract quantity and food name
    const match = item.match(/^(\d+(?:\.\d+)?)\s*(cup|cups|gm|g|gram|grams|kg|piece|pieces|pcs|pc|slice|slices|tbsp|tsp|ml)?\s*(?:of\s+)?(.+)$/i);
    
    if (match) {
      const quantity = parseFloat(match[1]);
      const unit = match[2] ? match[2].toLowerCase() : 'piece';
      const foodName = match[3].trim().toLowerCase();
      
      // Find matching food in database
      const foodKey = Object.keys(nutritionDatabase).find(key => 
        foodName.includes(key) || key.includes(foodName)
      );
      
      if (foodKey) {
        const multiplier = unitConversions[unit] || 1.0;
        items.push({
          food: foodKey,
          quantity: quantity * multiplier,
          originalInput: item
        });
      } else {
        // Try to find partial matches
        const partialMatch = Object.keys(nutritionDatabase).find(key => 
          foodName.includes(key) || key.includes(foodName.split(' ')[0])
        );
        if (partialMatch) {
          const multiplier = unitConversions[unit] || 1.0;
          items.push({
            food: partialMatch,
            quantity: quantity * multiplier,
            originalInput: item
          });
        }
      }
    } else {
      // Try to parse without explicit quantity (assume 1 piece/cup)
      const foodName = item.toLowerCase().replace(/^a\s+|an\s+|the\s+/i, '').trim();
      const foodKey = Object.keys(nutritionDatabase).find(key => 
        foodName.includes(key) || key.includes(foodName)
      );
      
      if (foodKey) {
        items.push({
          food: foodKey,
          quantity: 1.0,
          originalInput: item
        });
      }
    }
  }
  
  return items;
}

// Calculate total nutrition using Gemini AI
export const calculateNutrition = async (req, res) => {
  try {
    const { foodInput } = req.body;
    
    if (!foodInput || typeof foodInput !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide food input as a string'
      });
    }

    // Build prompt for Gemini
    const prompt = `You are a nutrition expert. Analyze the following food items and calculate the total nutritional values.

Food items: "${foodInput}"

Please calculate the total nutrition for all the food items mentioned. Return a JSON object with the following structure:
{
  "protein": <total protein in grams>,
  "carbs": <total carbohydrates in grams>,
  "fats": <total fats in grams>,
  "calories": <total calories>,
  "fiber": <total fiber in grams, optional>,
  "sodium": <total sodium in mg, optional>,
  "calcium": <total calcium in mg, optional>,
  "iron": <total iron in mg, optional>,
  "vitaminC": <total vitamin C in mg, optional>,
  "sugar": <total sugar in grams, optional>
}

Important instructions:
- Parse the food items and quantities correctly (e.g., "2 chapati", "1 cup daal", "50 gm paneer")
- Calculate totals for all items combined
- Use standard nutritional values per 100g or per standard serving
- For Indian foods, use accurate nutritional data
- Return only valid JSON, no markdown, no explanations
- Round all values to 1 decimal place
- If a nutrient is not available, set it to 0 or omit it

Return ONLY valid JSON. Do not include code fences or extra text.`;

    // Gemini call with strict JSON output and retry logic
    const model = genai.getGenerativeModel({
      model: MODEL_ID,
      generationConfig: {
        temperature: 0.3,
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
        console.log(`Attempting to get Gemini response for nutrition calculation (Attempt ${attempt}/${MAX_RETRIES})`);
        
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
          console.log(`Successfully got and parsed nutrition data from Gemini on attempt ${attempt}`);
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
      console.error(`All ${MAX_RETRIES} attempts failed for nutrition calculation. Last error:`, lastError?.message);
      // Fall through to database fallback
    } else {
      // Successfully got response from Gemini
      // Ensure all required fields exist with default values
      const totalNutrition = {
        protein: parsed.protein || 0,
        carbs: parsed.carbs || 0,
        fats: parsed.fats || 0,
        calories: parsed.calories || 0,
        fiber: parsed.fiber || 0,
        sodium: parsed.sodium || 0,
        calcium: parsed.calcium || 0,
        iron: parsed.iron || 0,
        vitaminC: parsed.vitaminC || 0,
        sugar: parsed.sugar || 0
      };

      // Round to 1 decimal place
      Object.keys(totalNutrition).forEach(key => {
        if (totalNutrition[key] !== undefined && typeof totalNutrition[key] === 'number') {
          totalNutrition[key] = Math.round(totalNutrition[key] * 10) / 10;
        }
      });

      return res.json({
        success: true,
        nutrition: totalNutrition,
        message: `Calculated nutrition using AI for: ${foodInput}`
      });
    }

    // Fallback to database method if Gemini fails
    console.log('Falling back to database method...');
    const parsedItems = parseFoodInput(foodInput);
    
    if (parsedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not recognize any food items. Please enter items like "2 chapati, 1 cup daal, 50 gm panner"'
      });
    }
    
    // Calculate total nutrition from database
    const totalNutrition = {
      protein: 0,
      carbs: 0,
      fats: 0,
      calories: 0,
      fiber: 0,
      sodium: 0,
      calcium: 0,
      iron: 0,
      vitaminC: 0,
      sugar: 0
    };
    
    const recognizedFoods = [];
    
    for (const item of parsedItems) {
      const foodData = nutritionDatabase[item.food];
      if (foodData) {
        const quantity = item.quantity;
        
        totalNutrition.protein += foodData.protein * quantity;
        totalNutrition.carbs += foodData.carbs * quantity;
        totalNutrition.fats += foodData.fats * quantity;
        totalNutrition.calories += foodData.calories * quantity;
        totalNutrition.fiber += (foodData.fiber || 0) * quantity;
        totalNutrition.sodium += (foodData.sodium || 0) * quantity;
        totalNutrition.calcium += (foodData.calcium || 0) * quantity;
        totalNutrition.iron += (foodData.iron || 0) * quantity;
        totalNutrition.vitaminC += (foodData.vitaminC || 0) * quantity;
        
        recognizedFoods.push({
          food: item.food,
          quantity: item.quantity,
          originalInput: item.originalInput
        });
      }
    }
    
    // Round to 1 decimal place
    Object.keys(totalNutrition).forEach(key => {
      if (totalNutrition[key] !== undefined) {
        totalNutrition[key] = Math.round(totalNutrition[key] * 10) / 10;
      }
    });
    
    res.json({
      success: true,
      nutrition: totalNutrition,
      recognizedFoods: recognizedFoods,
      message: `Calculated nutrition for ${recognizedFoods.length} food item(s) (using database fallback)`
    });
    
  } catch (error) {
    console.error('Nutrition calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating nutrition. Please try again.'
    });
  }
};

// Get available foods
export const getAvailableFoods = async (req, res) => {
  try {
    const foods = Object.keys(nutritionDatabase).sort();
    res.json({
      success: true,
      foods: foods,
      count: foods.length
    });
  } catch (error) {
    console.error('Error getting foods:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available foods'
    });
  }
};

