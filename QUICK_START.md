# 🚀 Quick Start Guide - ML Integration

## Services Status

- ✅ **ML API**: Running on `http://localhost:8000` (Verified)
- ⏳ **Backend**: Starting on `http://localhost:5000` (You're running it)
- 📊 **Model**: Random Forest loaded and ready

## Test After Backend Starts

```bash
node test_ml_integration.js
```

## New API Endpoints

### 1. Full Health Analysis with ML

```
POST /api/reports/analyze-with-ml
Authorization: Bearer <token>

Body: {
  "symptoms": ["headache", "fever", "cough"],
  "duration": "3 days",
  "severity": "moderate",
  "dietPreference": "vegetarian"
}
```

### 2. Quick Disease Prediction

```
POST /api/reports/predict-disease
Authorization: Bearer <token>

Body: {
  "symptoms": ["headache", "fever"]
}
```

### 3. Check ML Health

```
GET /api/reports/ml-health
```

## What Happens Now

1. **User enters symptoms** → Frontend sends to backend
2. **Backend calls ML API** → Gets disease prediction
3. **ML model predicts** → Returns disease + confidence
4. **Backend calls Gemini** → Gets comprehensive analysis
5. **Combined response** → Saved to MongoDB
6. **User receives** → Complete health report with ML diagnosis

## Expected ML Response

```json
{
  "predicted_disease": "Bronchial Asthma",
  "confidence": 0.265,
  "urgency_flag": {
    "level": "low",
    "recommended_action": "Consult a clinician"
  },
  "top_k": [
    { "rank": 1, "disease": "Bronchial Asthma", "confidence": 0.265 },
    { "rank": 2, "disease": "AIDS", "confidence": 0.12 },
    { "rank": 3, "disease": "Paralysis", "confidence": 0.1 }
  ]
}
```

## Files Modified

✅ `controllers/HealthController.js` - New ML integration functions
✅ `models/Health_Report.js` - Added mlPrediction field
✅ `routes/healthReportRoutes.js` - New ML endpoints
✅ `.env` - Added ML_API_URL
✅ `package.json` - Added axios dependency

## Next: Frontend Integration

Update your frontend to call:

```typescript
const response = await axios.post(
  "/api/reports/analyze-with-ml",
  { symptoms, duration, severity },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

## Support Docs

- `INTEGRATION_COMPLETE.md` - Full summary
- `ML_INTEGRATION_GUIDE.md` - Complete API docs
- `test_ml_integration.js` - Test examples
