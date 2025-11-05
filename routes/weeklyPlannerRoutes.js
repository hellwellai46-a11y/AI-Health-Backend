import express from "express";
import {
 generateAnalysisController
} from "../controllers/healthReportController.js";
import {
  getPlannersByUser,
  getPlannerById
} from "../controllers/weeklyPlannerController.js";
import { authenticateToken } from "../midddlewares/auth.js";

const router = express.Router();

router.post("/generate-analysis", authenticateToken, generateAnalysisController); // AI-generated plan
router.get("/user/:userId", authenticateToken, getPlannersByUser); // Get all planners for user
router.get("/:id", authenticateToken, getPlannerById); // Get single planner by ID

export default router;
