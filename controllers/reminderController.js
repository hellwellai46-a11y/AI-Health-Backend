import Reminder from "../models/Reminder.js";
import HealthReport from "../models/Health_Report.js";
import WeeklyPlanner from "../models/DietPlan.js";
import User from "../models/user_model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_ID = "gemini-2.0-flash";

// Generate AI-suggested optimal time for reminders
async function suggestOptimalTime(userId, reminderType, userActivity = {}) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const prompt = `
You are a health AI assistant. Suggest the optimal time for a ${reminderType} reminder based on the following information:

User Activity Pattern:
- Sleep schedule: ${userActivity.sleepTime || 'Unknown'}
- Wake time: ${userActivity.wakeTime || 'Unknown'}
- Meal times: ${userActivity.mealTimes || 'Unknown'}
- Work schedule: ${userActivity.workSchedule || 'Unknown'}
- Activity level: ${userActivity.activityLevel || 'Moderate'}

Reminder Type: ${reminderType}

Consider:
- For medicine: Should be taken with meals or at consistent intervals
- For exercise/yoga: Best times based on energy levels (morning for some, evening for others)
- Avoid times during sleep
- Consider meal times for medicine
- Respect work schedule

Respond with ONLY a time in 24-hour format (HH:MM), nothing else. Example: "09:00" or "14:30"
`;

    const model = genai.getGenerativeModel({
      model: MODEL_ID,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 10,
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const timeString = response.text().trim();

    // Parse time string (HH:MM)
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      // Default fallback times based on type
      if (reminderType === 'medicine') return { hours: 9, minutes: 0 }; // Morning
      if (reminderType === 'exercise' || reminderType === 'yoga') return { hours: 7, minutes: 0 }; // Early morning
      return { hours: 10, minutes: 0 }; // Default
    }

    return { hours, minutes };
  } catch (error) {
    console.error("AI time suggestion error:", error);
    // Return default times based on reminder type
    if (reminderType === 'medicine') return { hours: 9, minutes: 0 };
    if (reminderType === 'exercise' || reminderType === 'yoga') return { hours: 7, minutes: 0 };
    return { hours: 10, minutes: 0 };
  }
}

// Calculate next reminder time based on frequency
function calculateNextReminder(scheduledTime, frequency, daysOfWeek = []) {
  const now = new Date();
  const next = new Date(scheduledTime);

  if (frequency === 'once') {
    return scheduledTime > now ? scheduledTime : null;
  }

  if (frequency === 'daily') {
    // Set to today at the scheduled time
    next.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  if (frequency === 'weekly' && daysOfWeek.length > 0) {
    const currentDay = now.getDay();
    const today = new Date(now);
    today.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
    
    // Find next matching day
    for (let i = 0; i < 7; i++) {
      const checkDay = (currentDay + i) % 7;
      if (daysOfWeek.includes(checkDay)) {
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + i);
        if (nextDate > now || (nextDate.getDate() === today.getDate() && nextDate.getHours() * 60 + nextDate.getMinutes() > now.getHours() * 60 + now.getMinutes())) {
          return nextDate;
        }
      }
    }
    // If no match this week, get first day of next week
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7 - currentDay + Math.min(...daysOfWeek));
    nextWeek.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
    return nextWeek;
  }

  if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1);
    return next > now ? next : null;
  }

  return next;
}

// Create reminder from health report (medicines)
export const createRemindersFromReport = async (req, res) => {
  try {
    const { reportId } = req.body;
    const userId = req.userId || req.body.userId; // Use from middleware or fallback to body

    const report = await HealthReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }

    const reminders = [];
    const medicines = report.medicines || [];

    // Get user activity patterns (could be from user profile or default)
    const userActivity = {
      sleepTime: '22:00',
      wakeTime: '07:00',
      mealTimes: '08:00, 13:00, 19:00',
      activityLevel: 'Moderate'
    };

    for (const medicine of medicines.slice(0, 5)) { // Limit to 5 medicines
      const suggestedTime = await suggestOptimalTime(userId, 'medicine', userActivity);
      const today = new Date();
      const scheduledTime = new Date(today);
      scheduledTime.setHours(suggestedTime.hours, suggestedTime.minutes, 0, 0);
      
      if (scheduledTime <= today) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const reminder = await Reminder.create({
        userId,
        type: 'medicine',
        title: `Take ${medicine}`,
        description: `Medicine reminder from your health report`,
        scheduledTime,
        frequency: 'daily',
        priority: 'high',
        relatedReportId: reportId,
        aiSuggestedTime: scheduledTime,
        metadata: { medicineName: medicine },
        nextReminder: calculateNextReminder(scheduledTime, 'daily')
      });

      reminders.push(reminder);
    }

    res.status(201).json({
      success: true,
      message: `Created ${reminders.length} medicine reminders`,
      data: reminders
    });
  } catch (error) {
    console.error("Create reminders from report error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create reminder from weekly planner (exercises/yoga)
export const createRemindersFromPlanner = async (req, res) => {
  try {
    const { plannerId } = req.body;
    const userId = req.userId || req.body.userId; // Use from middleware or fallback to body

    const planner = await WeeklyPlanner.findById(plannerId);
    if (!planner) {
      return res.status(404).json({ success: false, error: "Planner not found" });
    }

    const reminders = [];
    const userActivity = {
      sleepTime: '22:00',
      wakeTime: '07:00',
      mealTimes: '08:00, 13:00, 19:00',
      activityLevel: 'Moderate'
    };

    // Create exercise reminders (daily)
    if (planner.days && planner.days.length > 0) {
      const firstDay = planner.days[0];
      const exercises = firstDay.exercises || [];
      const yoga = firstDay.yoga || [];

      // Suggest optimal exercise time
      const exerciseTime = await suggestOptimalTime(userId, 'exercise', userActivity);
      const today = new Date();
      const scheduledTime = new Date(today);
      scheduledTime.setHours(exerciseTime.hours, exerciseTime.minutes, 0, 0);
      
      if (scheduledTime <= today) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      if (exercises.length > 0) {
        const reminder = await Reminder.create({
          userId,
          type: 'exercise',
          title: `Exercise: ${exercises[0]}`,
          description: exercises.slice(0, 3).join(', '),
          scheduledTime,
          frequency: 'daily',
          priority: 'medium',
          relatedPlannerId: plannerId,
          aiSuggestedTime: scheduledTime,
          metadata: { exerciseName: exercises[0] },
          nextReminder: calculateNextReminder(scheduledTime, 'daily')
        });
        reminders.push(reminder);
      }

      // Suggest optimal yoga time
      if (yoga.length > 0) {
        const yogaTime = await suggestOptimalTime(userId, 'yoga', userActivity);
        const yogaScheduledTime = new Date(today);
        yogaScheduledTime.setHours(yogaTime.hours, yogaTime.minutes, 0, 0);
        
        if (yogaScheduledTime <= today) {
          yogaScheduledTime.setDate(yogaScheduledTime.getDate() + 1);
        }

        const yogaReminder = await Reminder.create({
          userId,
          type: 'yoga',
          title: `Yoga: ${yoga[0]}`,
          description: yoga.slice(0, 3).join(', '),
          scheduledTime: yogaScheduledTime,
          frequency: 'daily',
          priority: 'medium',
          relatedPlannerId: plannerId,
          aiSuggestedTime: yogaScheduledTime,
          metadata: { exerciseName: yoga[0] },
          nextReminder: calculateNextReminder(yogaScheduledTime, 'daily')
        });
        reminders.push(yogaReminder);
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${reminders.length} exercise/yoga reminders`,
      data: reminders
    });
  } catch (error) {
    console.error("Create reminders from planner error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create custom reminder
export const createReminder = async (req, res) => {
  try {
    const { type, title, description, scheduledTime, frequency, daysOfWeek, priority, metadata } = req.body;
    const userId = req.userId || req.body.userId; // Use from middleware or fallback to body

    if (!userId || !type || !title || !scheduledTime) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const userActivity = {
      sleepTime: '22:00',
      wakeTime: '07:00',
      mealTimes: '08:00, 13:00, 19:00',
      activityLevel: 'Moderate'
    };

    // Get AI-suggested time if not provided
    let finalScheduledTime = new Date(scheduledTime);
    if (!scheduledTime || isNaN(new Date(scheduledTime).getTime())) {
      const suggestedTime = await suggestOptimalTime(userId, type, userActivity);
      finalScheduledTime = new Date();
      finalScheduledTime.setHours(suggestedTime.hours, suggestedTime.minutes, 0, 0);
      if (finalScheduledTime <= new Date()) {
        finalScheduledTime.setDate(finalScheduledTime.getDate() + 1);
      }
    }

    const reminder = await Reminder.create({
      userId,
      type,
      title,
      description: description || '',
      scheduledTime: finalScheduledTime,
      frequency: frequency || 'daily',
      daysOfWeek: daysOfWeek || [],
      priority: priority || 'medium',
      aiSuggestedTime: finalScheduledTime,
      metadata: metadata || {},
      nextReminder: calculateNextReminder(finalScheduledTime, frequency || 'daily', daysOfWeek)
    });

    res.status(201).json({
      success: true,
      message: "Reminder created successfully",
      data: reminder
    });
  } catch (error) {
    console.error("Create reminder error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all reminders for user
export const getUserReminders = async (req, res) => {
  try {
    const userId = req.userId || req.params.userId; // Use from middleware or fallback to params
    const { isActive, type } = req.query;

    const query = { userId };
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (type) query.type = type;

    const reminders = await Reminder.find(query)
      .sort({ nextReminder: 1, priority: -1 })
      .populate('relatedReportId', 'summary healthScore')
      .populate('relatedPlannerId', 'weekStart weekEnd');

    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    console.error("Get reminders error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update reminder
export const updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.scheduledTime || updates.frequency || updates.daysOfWeek) {
      const reminder = await Reminder.findById(id);
      if (!reminder) {
        return res.status(404).json({ success: false, error: "Reminder not found" });
      }

      const scheduledTime = updates.scheduledTime ? new Date(updates.scheduledTime) : reminder.scheduledTime;
      const frequency = updates.frequency || reminder.frequency;
      const daysOfWeek = updates.daysOfWeek || reminder.daysOfWeek;

      updates.nextReminder = calculateNextReminder(scheduledTime, frequency, daysOfWeek);
    }

    const reminder = await Reminder.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!reminder) {
      return res.status(404).json({ success: false, error: "Reminder not found" });
    }

    res.status(200).json({
      success: true,
      message: "Reminder updated successfully",
      data: reminder
    });
  } catch (error) {
    console.error("Update reminder error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete reminder
export const deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await Reminder.findByIdAndDelete(id);

    if (!reminder) {
      return res.status(404).json({ success: false, error: "Reminder not found" });
    }

    res.status(200).json({
      success: true,
      message: "Reminder deleted successfully"
    });
  } catch (error) {
    console.error("Delete reminder error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark reminder as completed
export const completeReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await Reminder.findById(id);
    if (!reminder) {
      return res.status(404).json({ success: false, error: "Reminder not found" });
    }

    // Mark as completed
    reminder.isCompleted = true;
    reminder.completedAt = new Date();

    // Calculate next reminder if recurring
    if (reminder.frequency !== 'once') {
      reminder.nextReminder = calculateNextReminder(reminder.scheduledTime, reminder.frequency, reminder.daysOfWeek);
      // Keep isCompleted = true until next reminder time arrives
      // This allows tracking of completions properly
    } else {
      // For one-time reminders, mark as inactive after completion
      reminder.isActive = false;
    }

    await reminder.save();

    res.status(200).json({
      success: true,
      message: "Reminder marked as completed",
      data: reminder
    });
  } catch (error) {
    console.error("Complete reminder error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

