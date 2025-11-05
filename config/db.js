import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Check if MONGO_URI is set
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI environment variable is not set!");
      console.error("Please add MONGO_URI to your .env file");
      process.exit(1);
    }

    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log("✅ MongoDB already connected");
      return mongoose.connection;
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
    });

    console.log("✅ MongoDB connected successfully");
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn("⚠️  MongoDB disconnected");
    });

    mongoose.connection.on('reconnected', () => {
      console.log("✅ MongoDB reconnected");
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });

    return mongoose.connection;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.error("\nPlease check:");
    console.error("  1. MongoDB is running (mongod service)");
    console.error("  2. MONGO_URI is correct in your .env file");
    console.error("     Example: MONGO_URI=mongodb://localhost:27017/your-database-name");
    console.error("  3. Network connectivity to MongoDB");
    console.error("  4. MongoDB port 27017 is not blocked by firewall");
    process.exit(1);
  }
};
