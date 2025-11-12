import mongoose from "mongoose";

const healthReportSchema = new mongoose.Schema({
  userId: { type: String },
  date: { type: Date, default: Date.now },
  symptoms: [String],
  causes: [String],
  deficiencies: [String],
  prevention: [String],
  cure: [String],
  medicines: [String],
  yoga: [String],
  exercises: [String],
  foodsToEat: [String],
  foodsToAvoid: [String],
  thingsToFollow: [String],
  thingsToAvoid: [String],
  naturalRemedies: [String],
  healthScore: { type: Number, default: 75 },
  summary: { type: String, default: "" },
  rawInput: { type: String },
  dietPreference: {
    type: String,
    enum: ["vegetarian", "non-vegetarian"],
    default: "non-vegetarian",
  },
  duration: { type: String },
  severity: { type: String },
  frequency: { type: String },
  worseCondition: { type: String },
  existingConditions: { type: String },
  medications: { type: String },
  lifestyle: { type: String },
  // ML Prediction Data
  mlPrediction: {
    disease: { type: String },
    confidence: { type: Number },
    urgencyLevel: { type: String },
    urgencyReason: { type: String },
    recommendedAction: { type: String },
    precautions: [String], // ML-provided precautions for the predicted disease
    topPredictions: [
      {
        rank: { type: Number },
        disease: { type: String },
        confidence: { type: Number },
      },
    ],
  },
});

export default mongoose.model("HealthReport", healthReportSchema);
