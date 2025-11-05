import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['medicine', 'exercise', 'yoga', 'doctor_visit', 'other'], 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: "" 
  },
  scheduledTime: { 
    type: Date, 
    required: true 
  },
  frequency: { 
    type: String, 
    enum: ['once', 'daily', 'weekly', 'monthly'], 
    default: 'daily' 
  },
  daysOfWeek: [{ 
    type: Number, 
    min: 0, 
    max: 6 
  }], // 0 = Sunday, 6 = Saturday
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isCompleted: { 
    type: Boolean, 
    default: false 
  },
  completedAt: { 
    type: Date 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  aiSuggestedTime: { 
    type: Date 
  }, // Time suggested by AI based on user patterns
  relatedReportId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "HealthReport" 
  },
  relatedPlannerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "WeeklyPlanner" 
  },
  metadata: {
    medicineName: String,
    exerciseName: String,
    doctorName: String,
    appointmentDate: Date,
  },
  lastReminded: { 
    type: Date 
  },
  nextReminder: { 
    type: Date 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for efficient querying
reminderSchema.index({ userId: 1, scheduledTime: 1 });
reminderSchema.index({ userId: 1, isActive: 1, nextReminder: 1 });

// Update updatedAt before saving
reminderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Reminder", reminderSchema);


