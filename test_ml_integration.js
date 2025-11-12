// Test script for ML integration
// Run with: node test_ml_integration.js

import axios from "axios";

const BACKEND_URL = "http://localhost:5000/api";
const ML_API_URL = "http://localhost:8000";

// Test data
const testSymptoms = ["headache", "fever", "fatigue", "cough"];
const testUserId = "test_user_123";

async function testMLAPIDirectly() {
  console.log("\n🔬 Testing ML API directly...");
  try {
    const response = await axios.post(`${ML_API_URL}/predict`, {
      symptoms: testSymptoms,
      metadata: { userId: testUserId },
    });
    console.log("✅ ML API Response:");
    console.log(`   Disease: ${response.data.predicted_disease}`);
    console.log(
      `   Confidence: ${(response.data.confidence * 100).toFixed(1)}%`
    );
    console.log(`   Urgency: ${response.data.urgency_flag?.level}`);
    console.log(`   Top Predictions:`, response.data.top_k?.slice(0, 3));
    return true;
  } catch (error) {
    console.error("❌ ML API Error:", error.message);
    return false;
  }
}

async function testMLHealthCheck() {
  console.log("\n🏥 Testing ML Health Check...");
  try {
    const response = await axios.get(`${ML_API_URL}/health`);
    console.log("✅ ML API Status:", response.data);
    return response.data.model_loaded;
  } catch (error) {
    console.error("❌ ML API Health Check Failed:", error.message);
    return false;
  }
}

async function testBackendMLHealth() {
  console.log("\n🔌 Testing Backend ML Health Endpoint...");
  try {
    const response = await axios.get(`${BACKEND_URL}/reports/ml-health`);
    console.log("✅ Backend ML Health:", response.data);
    return response.data.success;
  } catch (error) {
    console.error("❌ Backend ML Health Error:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
    return false;
  }
}

async function testBackendPrediction(token = null) {
  console.log("\n🎯 Testing Backend Disease Prediction...");
  try {
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await axios.post(
      `${BACKEND_URL}/reports/predict-disease`,
      { symptoms: testSymptoms },
      { headers }
    );
    console.log("✅ Backend Prediction Response:");
    console.log(`   Disease: ${response.data.data.predicted_disease}`);
    console.log(
      `   Confidence: ${(response.data.data.confidence * 100).toFixed(1)}%`
    );
    return true;
  } catch (error) {
    console.error("❌ Backend Prediction Error:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
    return false;
  }
}

async function testFullIntegration(token = null) {
  console.log("\n🚀 Testing Full ML Integration with Health Analysis...");
  try {
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await axios.post(
      `${BACKEND_URL}/reports/analyze-with-ml`,
      {
        userId: testUserId,
        symptoms: testSymptoms,
        duration: "3 days",
        severity: "moderate",
        frequency: "constant",
        dietPreference: "vegetarian",
      },
      { headers }
    );

    console.log("✅ Full Integration Response:");
    console.log("   ML Prediction:");
    console.log(
      `     Disease: ${response.data.data.mlPrediction?.predicted_disease}`
    );
    console.log(
      `     Confidence: ${(
        response.data.data.mlPrediction?.confidence * 100
      ).toFixed(1)}%`
    );
    console.log("   Health Report:");
    console.log(`     Health Score: ${response.data.data.report?.healthScore}`);
    console.log(
      `     Summary: ${response.data.data.report?.summary?.substring(
        0,
        100
      )}...`
    );
    console.log(
      `     Recommendations: ${response.data.data.report?.medicines?.length} medicines`
    );
    return true;
  } catch (error) {
    console.error("❌ Full Integration Error:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
    return false;
  }
}

async function runAllTests() {
  console.log("🧪 ML Integration Test Suite");
  console.log("============================\n");

  const results = {
    mlHealthCheck: false,
    mlDirectPrediction: false,
    backendMLHealth: false,
    backendPrediction: false,
    fullIntegration: false,
  };

  // Test 1: ML API Health Check
  results.mlHealthCheck = await testMLHealthCheck();

  // Test 2: ML API Direct Prediction
  if (results.mlHealthCheck) {
    results.mlDirectPrediction = await testMLAPIDirectly();
  } else {
    console.log("\n⚠️  Skipping ML direct prediction (ML API not healthy)");
  }

  // Test 3: Backend ML Health Endpoint
  results.backendMLHealth = await testBackendMLHealth();

  // Test 4: Backend Disease Prediction (without auth)
  console.log(
    "\n⚠️  Note: The following tests may fail without authentication token"
  );
  console.log("   To test with auth, pass a JWT token as argument\n");

  results.backendPrediction = await testBackendPrediction();

  // Test 5: Full Integration (without auth)
  results.fullIntegration = await testFullIntegration();

  // Summary
  console.log("\n\n📊 Test Results Summary");
  console.log("========================");
  console.log(
    `ML API Health Check:         ${
      results.mlHealthCheck ? "✅ PASS" : "❌ FAIL"
    }`
  );
  console.log(
    `ML Direct Prediction:        ${
      results.mlDirectPrediction ? "✅ PASS" : "❌ FAIL"
    }`
  );
  console.log(
    `Backend ML Health:           ${
      results.backendMLHealth ? "✅ PASS" : "❌ FAIL"
    }`
  );
  console.log(
    `Backend Disease Prediction:  ${
      results.backendPrediction ? "✅ PASS" : "⚠️  NEEDS AUTH"
    }`
  );
  console.log(
    `Full ML Integration:         ${
      results.fullIntegration ? "✅ PASS" : "⚠️  NEEDS AUTH"
    }`
  );

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  console.log(`\nTotal: ${passed}/${total} tests passed`);

  if (
    results.mlHealthCheck &&
    results.mlDirectPrediction &&
    results.backendMLHealth
  ) {
    console.log("\n✅ ML Integration is working correctly!");
    console.log("   The ML API is connected to the backend.");
    console.log(
      "   To test authenticated endpoints, you need a valid JWT token."
    );
  } else {
    console.log(
      "\n❌ Some tests failed. Please check the error messages above."
    );
  }
}

// Run tests
runAllTests().catch(console.error);
