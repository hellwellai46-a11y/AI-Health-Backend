import cron from "node-cron";
import mongoose from "mongoose";
import Reminder from "../models/Reminder.js";
import User from "../models/user_model.js";
import { sendReminderEmail } from "./emailService.js";

// Check if MongoDB is connected
function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

// Send notification (email + console log)
async function sendNotification(userId, reminder) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`⚠️  User not found for reminder ${reminder._id}`);
      return;
    }

    // Check if user has email
    if (!user.email) {
      console.warn(`⚠️  User ${user._id} has no email address. Skipping email notification.`);
      console.log(`📬 Reminder Notification (Console only):`);
      console.log(`   Title: ${reminder.title}`);
      console.log(`   Type: ${reminder.type}`);
      console.log(`   Time: ${new Date(reminder.nextReminder).toLocaleString()}`);
      console.log(`   Description: ${reminder.description || 'N/A'}`);
      
      // Update last reminded time even if email not sent
      reminder.lastReminded = new Date();
      await reminder.save();
      return;
    }

    console.log(`📬 Sending reminder notification to ${user.email}:`);
    console.log(`   Title: ${reminder.title}`);
    console.log(`   Type: ${reminder.type}`);
    console.log(`   Time: ${new Date(reminder.nextReminder).toLocaleString()}`);
    console.log(`   Description: ${reminder.description || 'N/A'}`);

    // Send email if user has email address
    const emailResult = await sendReminderEmail({
      to: user.email,
      userName: user.name,
      reminder: reminder,
    });

    if (emailResult.success) {
      console.log(`✅ Email notification sent successfully to ${user.email}`);
    } else {
      console.warn(`⚠️  Email notification failed: ${emailResult.error}`);
      // Continue execution even if email fails
    }

    // Update last reminded time
    reminder.lastReminded = new Date();
    await reminder.save();
    
  } catch (error) {
    console.error("❌ Send notification error:", error);
  }
}

// Check and send reminders every minute
cron.schedule("* * * * *", async () => {
  try {
    // Check if database is connected before querying
    if (!isDatabaseConnected()) {
      console.warn("⚠️  Database not connected, skipping reminder check");
      return;
    }

    const now = new Date();
    const oneMinuteFromNow = new Date(now.getTime() + 60000); // Check next 1 minute

    // Find all active reminders that should be sent
    const reminders = await Reminder.find({
      isActive: true,
      nextReminder: {
        $gte: now,
        $lte: oneMinuteFromNow
      }
    }).populate("userId", "email name");

    for (const reminder of reminders) {
      // Get user ID - handle both populated and non-populated cases
      const userId = reminder.userId?._id || reminder.userId || reminder.user;
      
      // Send notification
      await sendNotification(userId, reminder);

      // Calculate next reminder time if recurring
      if (reminder.frequency !== "once") {
        const nextReminder = calculateNextReminder(
          reminder.scheduledTime,
          reminder.frequency,
          reminder.daysOfWeek
        );
        reminder.nextReminder = nextReminder;
        reminder.lastReminded = new Date();
        // Reset completion status when next reminder time is set (recurring reminder cycle)
        // This allows tracking of each completion separately
        if (reminder.isCompleted && reminder.completedAt) {
          reminder.isCompleted = false;
          reminder.completedAt = undefined;
        }
        await reminder.save();
      } else {
        // One-time reminder, mark as inactive after sending
        reminder.isActive = false;
        await reminder.save();
      }
    }

    if (reminders.length > 0) {
      console.log(`✅ Processed ${reminders.length} reminder(s)`);
    }
  } catch (error) {
    console.error("Cron job error:", error);
  }
});

// Helper function to calculate next reminder
function calculateNextReminder(scheduledTime, frequency, daysOfWeek = []) {
  const now = new Date();
  const next = new Date(scheduledTime);

  if (frequency === "once") {
    return scheduledTime > now ? scheduledTime : null;
  }

  if (frequency === "daily") {
    next.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  if (frequency === "weekly" && daysOfWeek.length > 0) {
    const currentDay = now.getDay();
    const today = new Date(now);
    today.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);

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

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7 - currentDay + Math.min(...daysOfWeek));
    nextWeek.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
    return nextWeek;
  }

  if (frequency === "monthly") {
    next.setMonth(next.getMonth() + 1);
    return next > now ? next : null;
  }

  return next;
}

console.log("⏰ Reminder Scheduler initialized - checking every minute");

export default cron;

