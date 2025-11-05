import  express from "express";
import  dotenv from  "dotenv";
import  cors from "cors";
import { connectDB } from "./config/db.js";

import weeklyPlannerRoutes from "./routes/weeklyPlannerRoutes.js";
import healthReportRoutes from "./routes/healthReportRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import nutritionRoutes from "./routes/nutritionRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:5173",
      process.env.FRONTEND_URL_PROD, // Production frontend URL
      "http://localhost:3000",
      "http://localhost:5173"
    ].filter(Boolean); // Remove undefined values
    
    // In production, allow specific origins; in development, allow all localhost
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
      // In development, allow localhost origins
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In production, only allow specified origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/reports", healthReportRoutes);
app.use("/api/weekly-planner", weeklyPlannerRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/nutrition", nutritionRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Health Report API is running...");
});

// Initialize server after MongoDB connection
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Initialize reminder scheduler only after DB connection
    const reminderScheduler = await import("./services/reminderScheduler.js");
    console.log("⏰ Reminder scheduler initialized");
    
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
