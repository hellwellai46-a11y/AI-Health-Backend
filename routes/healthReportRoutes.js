import express from "express";
import {
  getReportsByUser,
  getReportById,
  deleteReport,
  getAverageHealthScore,
} from "../controllers/healthReportController.js";
import { authenticateToken } from "../midddlewares/auth.js";
import { analyzeImage, upload } from "../controllers/imageAnalysisController.js";

const router = express.Router();

router.get("/user/:userId", authenticateToken, getReportsByUser);
router.get("/:id", authenticateToken, getReportById);
router.delete("/:id", authenticateToken, deleteReport);
router.get("/average-score/:userId", authenticateToken, getAverageHealthScore);
router.post("/analyze-image", authenticateToken, upload.single('image'), analyzeImage);

export default router;

