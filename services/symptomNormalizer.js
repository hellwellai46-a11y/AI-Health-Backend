import axios from "axios";

// Common symptom mappings for fallback
const SYMPTOM_MAPPINGS = {
  // Pain-related
  "stomach ache": "abdominal_pain",
  "tummy ache": "abdominal_pain",
  "belly pain": "abdominal_pain",
  "head hurts": "headache",
  migraine: "headache",
  "back hurts": "back_pain",
  "neck hurts": "neck_pain",
  "chest hurts": "chest_pain",

  // Respiratory
  "runny nose": "runny_nose",
  "stuffy nose": "congestion",
  "cant breathe": "breathlessness",
  "short of breath": "breathlessness",
  "trouble breathing": "breathlessness",
  wheezing: "wheezing",

  // Digestive
  "feeling sick": "nausea",
  "want to throw up": "nausea",
  vomiting: "vomiting",
  "loose motion": "diarrhoea",
  "upset stomach": "stomach_pain",
  constipated: "constipation",

  // General
  tired: "fatigue",
  exhausted: "fatigue",
  "no energy": "fatigue",
  hot: "high_fever",
  "burning up": "high_fever",
  cold: "chills",
  shivering: "chills",
  sweating: "sweating",
  dizzy: "dizziness",
  weak: "weakness",

  // Skin
  rash: "skin_rash",
  itchy: "itching",
  "red skin": "skin_rash",
  swelling: "swelling",

  // Other
  "sore throat": "sore_throat",
  "cant sleep": "insomnia",
  "weight loss": "weight_loss",
  "weight gain": "weight_gain",
  "no appetite": "loss_of_appetite",
};

/**
 * Extract and normalize symptoms from natural language using Gemini AI
 */
export const extractAndNormalizeSymptoms = async (
  naturalLanguageText,
  geminiModel
) => {
  try {
    console.log("🔍 Extracting symptoms from natural language input...");

    const extractionPrompt = `Extract medical symptoms from this text and normalize them to standard medical terms using underscores for multi-word terms.

User input: "${naturalLanguageText}"

Instructions:
1. Identify all mentioned symptoms
2. Convert to standard medical terminology (use underscores for spaces, e.g., "abdominal_pain", "runny_nose")
3. Remove severity descriptors (mild, severe, very, really, etc.)
4. Remove duplicates
5. Keep terms concise (1-3 words maximum)
6. Return as a JSON array of strings

Examples:
Input: "I have a really bad headache and my stomach hurts a lot"
Output: ["headache", "abdominal_pain"]

Input: "feeling very tired, running nose, and I'm hot with chills"
Output: ["fatigue", "runny_nose", "high_fever", "chills"]

Input: "My throat is sore, coughing badly, and feeling weak"
Output: ["sore_throat", "cough", "weakness"]

Return ONLY a valid JSON array with no additional text, explanations, or code blocks:`;

    const result = await geminiModel.generateContent(extractionPrompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean up response
    text = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Extract JSON array
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    const extractedSymptoms = JSON.parse(jsonMatch[0]);
    console.log("✅ Extracted and normalized symptoms:", extractedSymptoms);
    return extractedSymptoms;
  } catch (error) {
    console.error("❌ Error extracting symptoms with Gemini:", error.message);

    // Fallback to simple extraction
    console.log("⚠️ Using fallback symptom extraction...");
    const symptoms = naturalLanguageText
      .toLowerCase()
      .split(/[,;\n.]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => SYMPTOM_MAPPINGS[s] || s);

    console.log("Fallback extracted:", symptoms);
    return symptoms;
  }
};

/**
 * Validate symptoms by checking if ML API can process them
 * The ML API has fuzzy matching, so we just need to ensure we have something to send
 */
export const validateSymptoms = (symptoms) => {
  const validSymptoms = symptoms.filter((s) => s && s.trim().length > 0);
  const invalidSymptoms = symptoms.filter((s) => !s || s.trim().length === 0);

  if (invalidSymptoms.length > 0) {
    console.log("⚠️ Removed invalid symptoms:", invalidSymptoms);
  }

  console.log("📋 Valid symptoms for ML:", validSymptoms);

  return {
    validSymptoms,
    invalidSymptoms,
    allValid: invalidSymptoms.length === 0,
  };
};

/**
 * Normalize a single symptom using mapping dictionary
 */
export const normalizeSymptom = (symptom) => {
  const normalized = SYMPTOM_MAPPINGS[symptom.toLowerCase()] || symptom;
  return normalized;
};
