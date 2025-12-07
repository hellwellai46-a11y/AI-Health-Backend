# 🩺 HealWell AI — Backend

A secure, fast, and intelligent Node.js backend powering AI-generated health assessments, reports, weekly diet plans, user management, and dashboard analytics.

## ⚠️ Security Notice

**Important:** A `.env` file containing sensitive credentials was previously committed to this repository's git history. While it has been removed from tracking, the exposed credentials remain accessible in git history and should be considered compromised. 

**If you previously used credentials from this repository:**
- ✅ Rotate all API keys (Gemini, YouTube)
- ✅ Change MongoDB passwords
- ✅ Generate new email app passwords
- ✅ See [ENV_SETUP.md](./ENV_SETUP.md) for details

**For new users:** Follow [ENV_SETUP.md](./ENV_SETUP.md) to properly configure your environment with new, secure credentials.

---

## ⚙️ Tech Stack

* **Node.js + Express.js**
* **MongoDB + Mongoose**
* **JWT Authentication**
* **BCrypt Password Hashing**
* **AI Integration (via API Key)**
* **Multer (if profile upload enabled)**
* **CORS, Express Validator, Helmet**

---

## 📁 Project Structure

```
HealWell-Backend
 ┣ config/
 ┃ ┗ db.js
 ┣ controllers/
 ┣ models/
 ┣ routes/
 ┣ middlewares/
 ┣ utils/
 ┣ app.js
 ┣ server.js
 ┗ README.md
```

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/HealWell_Backend_code.git
cd HealWell_Backend_code
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then edit `.env` with your actual credentials. See **[ENV_SETUP.md](./ENV_SETUP.md)** for detailed setup instructions.

**Required variables:**
- `MONGO_URI` - MongoDB connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `JWT_SECRET` - Secret for JWT token signing

**Optional variables:**
- `SMTP_*` - Email service configuration (see [EMAIL_SETUP.md](./EMAIL_SETUP.md))
- `YOUTUBE_API_KEY` - For video recommendations (see [YOUTUBE_API_SETUP.md](./YOUTUBE_API_SETUP.md))

### 4️⃣ Start Server

```bash
npm run dev
```

Server runs at: **[http://localhost:5000](http://localhost:5000)**

---

# 📌 Backend Features

## 🔐 Authentication

* Signup → Name, Age, Email, Password
* Login → Email + Password
* Returns JWT token
* Passwords hashed using Bcrypt
* Middleware to protect routes

---

# 🧪 Start Assessment API

Receives:

* Description of symptoms
* Duration
* Severity
* Follow-up answers

Backend sends these details to AI via API key and returns a generated **detailed medical analysis**.

---

# 📄 Full AI Report Generation

The backend generates structured report sections:

* Symptoms
* Possible Causes
* Prevention
* Cure
* Recommended Medicines
* Yoga & Exercises
* Foods to Eat
* Foods to Avoid
* Natural Remedies
* Health Score (0–100)

Additional actions:

* Add Report to Dashboard
* Download Report as PDF
* Generate Diet Plan

---

# 🥗 Weekly Diet Plan API

AI-generated personalized weekly plan including:

* Daily Diet
* Exercises
* Medicines
* Habits & Lifestyle Tips

User can save weekly plans to dashboard.

---

# 📊 Dashboard APIs

Includes:

* Upload Profile Picture (optional)
* Fetch past health reports
* Fetch weekly diet plans
* Calculate and store BMI
* Get average health score

---

# 👥 About & Contact APIs

* Fetch website details
* Meet Our Team data (name, photo URL, description)
* Contact form storing: name, email, message

---

# 📝 Feedback API

Stores:

* Name
* Age
* City
* Feedback description

---

# 🤖 Chatbot API

Backend passes user query → AI → returns helpful answer.
Supports any health-related queries.

---

# 📦 Production Build

Use PM2 or systemd to run continuously.

```bash
pm2 start server.js
```

Enable CORS + rate limiting for security.

---

## 🤝 Contributing

Open a PR or create an issue.

---

## 📜 License

MIT License.

---

### 💙 Backend that powers intellige
