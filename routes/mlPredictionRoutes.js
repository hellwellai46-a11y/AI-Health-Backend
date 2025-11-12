import express from "express";
import axios from "axios";
import { authenticateToken } from "../midddlewares/auth.js";

const router = express.Router();
const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";

/**
 * POST /api/ml/disease-predict
 * Proxy prediction request to ML API
 */
router.post("/disease-predict", authenticateToken, async (req, res) => {
  try {
    const { symptoms, metadata } = req.body;

    if (!symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({
        success: false,
        error: "Symptoms array is required",
      });
    }

    if (symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one symptom is required",
      });
    }

    // Call ML API
    const response = await axios.post(`${ML_API_URL}/predict`, {
      symptoms,
      metadata: metadata || { userId: req.userId },
    });

    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("❌ ML prediction error:", error.message);

    if (error.response?.status === 503) {
      return res.status(503).json({
        success: false,
        error: "ML API model not loaded",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Disease prediction failed",
    });
  }
});

/**
 * POST /api/ml/batch-predict
 * Batch prediction for multiple symptoms
 */
router.post("/batch-predict", authenticateToken, async (req, res) => {
  try {
    const { predictions } = req.body;

    if (!Array.isArray(predictions) || predictions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Array of predictions is required",
      });
    }

    const response = await axios.post(
      `${ML_API_URL}/predict-batch`,
      predictions.map((p) => ({
        symptoms: p.symptoms,
        metadata: p.metadata || {},
      }))
    );

    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("❌ Batch prediction error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/ml/health
 * Check ML API status
 */
router.get("/health", async (req, res) => {
  try {
    const response = await axios.get(`${ML_API_URL}/health`);
    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("❌ ML API health check failed:", error.message);
    res.status(503).json({
      success: false,
      error: "ML API is not available",
      details: error.message,
    });
  }
});

export default router;
