// Test script for symptom extraction and ML integration
// Run with: node test_symptom_extraction.js

import axios from "axios";

const BACKEND_URL = "http://localhost:5000/api";

// Test cases with natural language input
const testCases = [
  {
    name: "Casual Language",
    input: "My head hurts really bad and I feel hot",
    expected: ["headache", "high_fever"],
  },
  {
    name: "Detailed Description",
    input:
      "I've been having stomach pain for 3 days, feeling nauseous, and can't eat anything",
    expected: ["abdominal_pain", "nausea", "loss_of_appetite"],
  },
  {
    name: "Mixed Terminology",
    input: "runny nose, cough, feeling tired, and having chills",
    expected: ["runny_nose", "cough", "fatigue", "chills"],
  },
  {
    name: "Complex Symptoms",
    input:
      "I have a sore throat, my body aches, I'm sweating a lot, and feeling very weak",
    expected: ["sore_throat", "body_ache", "sweating", "weakness"],
  },
  {
    name: "Informal Language",
    input: "cant breathe properly, chest hurts, dizzy",
    expected: ["breathlessness", "chest_pain", "dizziness"],
  },
];

async function testSymptomExtraction(testCase, token = null) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🧪 Test: ${testCase.name}`);
  console.log(`📝 Input: "${testCase.input}"`);
  console.log(`🎯 Expected: ${testCase.expected.join(", ")}`);

  try {
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await axios.post(
      `${BACKEND_URL}/weekly-planner/generate-analysis?type=report`,
      {
        symptomsText: testCase.input,
        duration: "2-3 days",
        severity: "moderate",
        dietPreference: "vegetarian",
      },
      { headers }
    );

    console.log("✅ Response received!");
    console.log("\n📊 Extracted Symptoms:", response.data.extractedSymptoms);

    if (response.data.mlPrediction) {
      console.log("\n🔬 ML Prediction:");
      console.log(
        `   Disease: ${response.data.mlPrediction.predicted_disease}`
      );
      console.log(
        `   Confidence: ${(response.data.mlPrediction.confidence * 100).toFixed(
          1
        )}%`
      );
      console.log(
        `   Urgency: ${response.data.mlPrediction.urgency_flag?.level}`
      );

      if (
        response.data.mlPrediction.precautions &&
        response.data.mlPrediction.precautions.length > 0
      ) {
        console.log("\n💊 ML Precautions:");
        response.data.mlPrediction.precautions.forEach((p, i) => {
          console.log(`   ${i + 1}. ${p}`);
        });
      }

      if (response.data.mlPrediction.top_k) {
        console.log("\n📈 Top Predictions:");
        response.data.mlPrediction.top_k.slice(0, 3).forEach((pred) => {
          console.log(
            `   - ${pred.disease}: ${(pred.confidence * 100).toFixed(1)}%`
          );
        });
      }
    } else {
      console.log("\n⚠️ No ML prediction available");
    }

    if (response.data.data.report) {
      console.log("\n📋 Health Report:");
      console.log(
        `   Health Score: ${response.data.data.report.healthScore}/100`
      );
      console.log(
        `   Summary: ${response.data.data.report.summary?.substring(0, 100)}...`
      );
    }

    return true;
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Error:", error.response.data);
    }
    return false;
  }
}

async function runAllTests() {
  console.log("🧪 Symptom Extraction & ML Integration Test Suite");
  console.log("=".repeat(60));
  console.log("\n⚠️  Note: Backend and ML API must be running");
  console.log("   Backend: http://localhost:5000");
  console.log("   ML API: http://localhost:8000\n");

  // Check if ML API is running
  try {
    const mlHealth = await axios.get("http://localhost:8000/health");
    console.log("✅ ML API Status:", mlHealth.data.status);
  } catch (error) {
    console.log("❌ ML API not reachable. Make sure it's running on port 8000");
    return;
  }

  // Check if backend is running
  try {
    await axios.get("http://localhost:5000/");
    console.log("✅ Backend is reachable\n");
  } catch (error) {
    console.log(
      "❌ Backend not reachable. Make sure it's running on port 5000"
    );
    return;
  }

  const results = [];

  for (const testCase of testCases) {
    const result = await testSymptomExtraction(testCase);
    results.push({ name: testCase.name, passed: result });

    // Wait a bit between tests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Summary
  console.log("\n\n" + "=".repeat(60));
  console.log("📊 Test Results Summary");
  console.log("=".repeat(60));

  results.forEach((r) => {
    console.log(`${r.passed ? "✅" : "❌"} ${r.name}`);
  });

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log(`\n Total: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log("\n✅ All tests passed! Symptom extraction working correctly.");
  } else {
    console.log(`\n⚠️  ${total - passed} test(s) failed. Check errors above.`);
  }
}

// Run tests
runAllTests().catch(console.error);
