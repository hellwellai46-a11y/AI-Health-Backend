import express from "express";
import {
  getReportsByUser,
  getReportById,
  deleteReport,
  getAverageHealthScore,
} from "../controllers/healthReportController.js";
import { authenticateToken } from "../midddlewares/auth.js";
import { analyzeImage, upload } from "../controllers/imageAnalysisController.js";
import { getHealthVideos } from "../controllers/youtubeController.js";

const router = express.Router();

router.get("/user/:userId", authenticateToken, getReportsByUser);
router.get("/:id", authenticateToken, getReportById);
router.delete("/:id", authenticateToken, deleteReport);
router.get("/average-score/:userId", authenticateToken, getAverageHealthScore);
router.post("/analyze-image", authenticateToken, upload.single('image'), analyzeImage);
router.post("/youtube-videos", authenticateToken, getHealthVideos);

export default router;

