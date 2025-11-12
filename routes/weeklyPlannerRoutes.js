import express from "express";
import { generateAnalysisController } from "../controllers/healthReportController.js";
import { generateHealthAnalysisWithML } from "../controllers/HealthController.js";
import {
  getPlannersByUser,
  getPlannerById,
} from "../controllers/weeklyPlannerController.js";
import { authenticateToken } from "../midddlewares/auth.js";

const router = express.Router();

// Use ML-integrated analysis (new)
router.post(
  "/generate-analysis-ml",
  authenticateToken,
  generateHealthAnalysisWithML
); // AI + ML analysis
// Keep old endpoint for backward compatibility
router.post(
  "/generate-analysis",
  authenticateToken,
  generateAnalysisController
); // Legacy AI-only analysis
router.get("/user/:userId", authenticateToken, getPlannersByUser); // Get all planners for user
router.get("/:id", authenticateToken, getPlannerById); // Get single planner by ID

export default router;
