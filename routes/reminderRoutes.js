import express from "express";
import {
  createReminder,
  getUserReminders,
  updateReminder,
  deleteReminder,
  completeReminder,
  createRemindersFromReport,
  createRemindersFromPlanner
} from "../controllers/reminderController.js";
import { protect } from "../midddlewares/auth.js";

const router = express.Router();

// Create reminders from health report
router.post("/from-report", protect, createRemindersFromReport);

// Create reminders from weekly planner
router.post("/from-planner", protect, createRemindersFromPlanner);

// Create custom reminder
router.post("/", protect, createReminder);

//done

// Get all reminders for user
router.get("/user/:userId", protect, getUserReminders);

// Update reminder
router.put("/:id", protect, updateReminder);

// Delete reminder
router.delete("/:id", protect, deleteReminder);

// Mark reminder as completed
router.post("/:id/complete", protect, completeReminder);

export default router;


