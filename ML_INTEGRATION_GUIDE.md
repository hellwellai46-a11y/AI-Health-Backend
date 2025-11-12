# ML Model Integration Guide

## Overview

Your custom disease prediction ML model has been successfully integrated with the AI-Health backend. The integration combines:

- **ML Model**: Random Forest classifier for disease prediction (trained on your dataset)
- **Gemini AI**: For comprehensive health analysis and recommendations
- **Backend API**: Node.js/Express endpoints to connect everything

## Architecture

```
Frontend → Backend API → ML API (FastAPI) → Disease Prediction
                      ↓
                 Gemini AI → Health Analysis & Recommendations
                      ↓
                 MongoDB → Store Results
```

## New API Endpoints

### 1. Health Analysis with ML Prediction

**Endpoint**: `POST /api/reports/analyze-with-ml`

Generates a comprehensive health report that includes:

- ML-based disease prediction
- Gemini AI health analysis
- Personalized recommendations (diet, exercise, yoga, medicines, etc.)

**Request Body**:

```json
{
  "userId": "user123",
  "symptoms": ["headache", "fever", "fatigue", "cough"],
  "duration": "3 days",
  "severity": "moderate",
  "frequency": "constant",
  "worseCondition": "evening",
  "existingConditions": ["diabetes"],
  "medications": ["metformin"],
  "lifestyle": {
    "exercise": "moderate",
    "sleep": "6-7 hours",
    "stress": "high"
  },
  "dietPreference": "vegetarian"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Health analysis generated successfully",
  "data": {
    "report": {
      "_id": "report_id",
      "userId": "user123",
      "symptoms": ["headache", "fever", "fatigue"],
      "causes": ["viral infection", "flu"],
      "prevention": ["rest", "hydration"],
      "medicines": ["acetaminophen", "rest"],
      "foodsToEat": ["fruits", "vegetables"],
      "healthScore": 65,
      "summary": "Based on symptoms...",
      "mlPrediction": {
        "disease": "Common Cold",
        "confidence": 0.85,
        "urgencyLevel": "low",
        "urgencyReason": "Low confidence prediction",
        "recommendedAction": "Consult a clinician",
        "topPredictions": [
          {
            "rank": 1,
            "disease": "Common Cold",
            "confidence": 0.85
          },
          {
            "rank": 2,
            "disease": "Flu",
            "confidence": 0.12
          }
        ]
      }
    },
    "mlPrediction": {
      "predicted_disease": "Common Cold",
      "confidence": 0.85,
      "symptoms_input": ["headache", "fever"],
      "extracted_symptoms": ["headache", "fever"],
      "urgency_flag": {
        "level": "low",
        "score": 0.85,
        "reason": "Low confidence prediction",
        "recommended_action": "Consult a clinician"
      }
    }
  }
}
```

### 2. Quick Disease Prediction (ML Only)

**Endpoint**: `POST /api/reports/predict-disease`

Get only the ML disease prediction without full health analysis (faster response).

**Request Body**:

```json
{
  "symptoms": ["headache", "fever", "cough"],
  "metadata": {
    "userId": "user123"
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "predicted_disease": "Common Cold",
    "confidence": 0.85,
    "symptoms_input": ["headache", "fever", "cough"],
    "extracted_symptoms": ["headache", "fever", "cough"],
    "precautions": [
      "Rest and avoid strenuous activities",
      "Stay hydrated",
      "Take over-the-counter cold medications"
    ],
    "urgency_flag": {
      "level": "low",
      "score": 0.85,
      "reason": "Low confidence prediction",
      "recommended_action": "Consult a clinician"
    },
    "top_k": [
      { "rank": 1, "disease": "Common Cold", "confidence": 0.85 },
      { "rank": 2, "disease": "Flu", "confidence": 0.12 }
    ]
  }
}
```

### 3. Check ML API Health

**Endpoint**: `GET /api/reports/ml-health`

Check if the ML API is running and model is loaded.

**Response**:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "model_loaded": true,
    "message": "ML API is ready"
  }
}
```

## ML API Direct Endpoints

Your ML API (FastAPI) also has direct endpoints at `http://localhost:8000`:

### 1. Predict Disease

**Endpoint**: `POST http://localhost:8000/predict`

```json
{
  "symptoms": ["headache", "fever"],
  "metadata": {}
}
```

### 2. Batch Prediction

**Endpoint**: `POST http://localhost:8000/predict-batch`

```json
[
  { "symptoms": ["headache", "fever"], "metadata": {} },
  { "symptoms": ["cough", "fatigue"], "metadata": {} }
]
```

### 3. Explain Prediction

**Endpoint**: `POST http://localhost:8000/explain`

```json
{
  "symptoms": ["headache", "fever"],
  "metadata": {}
}
```

### 4. Health Check

**Endpoint**: `GET http://localhost:8000/health`

## Setup Instructions

### 1. Start ML API

```bash
cd ml-api
python app.py
```

The ML API will start on `http://localhost:8000`

### 2. Verify ML API is Running

```bash
curl http://localhost:8000/health
```

### 3. Start Backend Server

```bash
cd AI-Health-Backend
npm start
```

The backend will start on `http://localhost:5000`

### 4. Test Integration

```bash
# Check ML health through backend
curl http://localhost:5000/api/reports/ml-health

# Test disease prediction
curl -X POST http://localhost:5000/api/reports/predict-disease \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "symptoms": ["headache", "fever", "cough"]
  }'
```

## Environment Variables

Make sure your `.env` file includes:

```env
# ML API Configuration
ML_API_URL=http://localhost:8000

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# MongoDB
MONGO_URI=your_mongodb_connection_string
```

## Frontend Integration

### Example: Using the ML-Integrated Analysis

```typescript
// services/healthReportService.ts
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const generateHealthReportWithML = async (data: {
  symptoms: string[];
  duration?: string;
  severity?: string;
  dietPreference?: string;
}) => {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${API_URL}/reports/analyze-with-ml`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export const predictDisease = async (symptoms: string[]) => {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${API_URL}/reports/predict-disease`,
    { symptoms },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export const checkMLHealth = async () => {
  const response = await axios.get(`${API_URL}/reports/ml-health`);
  return response.data;
};
```

### Example: React Component

```tsx
import React, { useState } from "react";
import {
  generateHealthReportWithML,
  checkMLHealth,
} from "../services/healthReportService";

const HealthAnalysisForm = () => {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mlStatus, setMlStatus] = useState<"healthy" | "unhealthy" | "unknown">(
    "unknown"
  );

  // Check ML API status on mount
  useEffect(() => {
    checkMLHealth()
      .then((res) => {
        setMlStatus(res.data.status);
      })
      .catch(() => setMlStatus("unhealthy"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await generateHealthReportWithML({
        symptoms,
        duration: "3 days",
        severity: "moderate",
        dietPreference: "vegetarian",
      });

      setResult(response.data);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="ml-status">
        ML API Status:
        <span className={`status-${mlStatus}`}>
          {mlStatus === "healthy" ? "✅ Online" : "❌ Offline"}
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter symptoms (comma-separated)"
          onChange={(e) =>
            setSymptoms(e.target.value.split(",").map((s) => s.trim()))
          }
        />
        <button type="submit" disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Health"}
        </button>
      </form>

      {result && (
        <div className="results">
          <h3>ML Prediction</h3>
          <p>
            <strong>Disease:</strong> {result.mlPrediction?.predicted_disease}
          </p>
          <p>
            <strong>Confidence:</strong>{" "}
            {(result.mlPrediction?.confidence * 100).toFixed(1)}%
          </p>
          <p>
            <strong>Urgency:</strong> {result.mlPrediction?.urgency_flag?.level}
          </p>

          <h3>Health Report</h3>
          <p>{result.report?.summary}</p>
          <p>
            <strong>Health Score:</strong> {result.report?.healthScore}/100
          </p>

          <h4>Recommendations</h4>
          <ul>
            {result.report?.medicines?.map((med: string, i: number) => (
              <li key={i}>{med}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HealthAnalysisForm;
```

## Features

### ML Model Features:

- ✅ Disease prediction from symptoms
- ✅ Confidence scores for predictions
- ✅ Top-5 differential diagnosis
- ✅ Urgency level assessment
- ✅ Precautions for each disease
- ✅ Fuzzy symptom matching
- ✅ Feature importance analysis

### Integrated Backend Features:

- ✅ Combines ML predictions with Gemini AI analysis
- ✅ Stores predictions in MongoDB
- ✅ User authentication and authorization
- ✅ Diet preference support (vegetarian/non-vegetarian)
- ✅ Comprehensive health recommendations
- ✅ Historical report tracking

## Troubleshooting

### ML API Not Responding

1. Check if ML API is running: `curl http://localhost:8000/health`
2. Check if model file exists: `ml-api/disease_model.pkl`
3. Check ML API logs for errors

### Backend Can't Connect to ML API

1. Verify `ML_API_URL` in `.env` file
2. Check if both servers are running
3. Check firewall settings

### Low Prediction Confidence

1. Add more symptoms to improve accuracy
2. Use exact symptom names from the model's vocabulary
3. Check symptom matching in ML API logs

## Next Steps

1. **Frontend Integration**: Update your React frontend to use the new endpoints
2. **Testing**: Test with various symptom combinations
3. **UI Enhancement**: Display ML predictions alongside Gemini analysis
4. **Monitoring**: Add logging and error tracking
5. **Deployment**: Deploy both ML API and backend to production

## Support

For issues or questions:

1. Check the backend logs: `AI-Health-Backend/logs`
2. Check ML API logs: `ml-api/logs`
3. Review the error messages in API responses
4. Test endpoints individually to isolate issues
