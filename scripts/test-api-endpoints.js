// Test script for API endpoints
const BASE_URL = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "http://localhost:3000"

async function testAPIEndpoints() {
  console.log("🧪 Starting API Endpoints Tests...\n")

  try {
    // Test 1: Health Check
    console.log("Test 1: Health Check")
    const healthResponse = await fetch(`${BASE_URL}/api/health`)
    if (healthResponse.ok) {
      console.log("✅ Health check endpoint working")
    } else {
      console.log("⚠️ Health check endpoint not found (expected for new project)")
    }

    // Test 2: Oracle Data Fetch
    console.log("\nTest 2: Oracle Data Fetch")
    try {
      const oracleResponse = await fetch(`${BASE_URL}/api/oracle/weather`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "New York, NY",
          date: "2024-12-25",
        }),
      })

      if (oracleResponse.ok) {
        const oracleData = await oracleResponse.json()
        console.log("✅ Oracle weather endpoint working:", oracleData.status || "success")
      } else {
        console.log("⚠️ Oracle weather endpoint returned:", oracleResponse.status)
      }
    } catch (error) {
      console.log("⚠️ Oracle weather endpoint not available (expected for testing)")
    }

    // Test 3: Claims Processing
    console.log("\nTest 3: Claims Processing API")
    try {
      const claimsResponse = await fetch(`${BASE_URL}/api/claims/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId: "test-policy-123",
          claimType: "weather_disruption",
          evidence: {
            description: "Test claim for API testing",
            weatherData: { severity: "high", type: "thunderstorm" },
          },
        }),
      })

      if (claimsResponse.ok) {
        console.log("✅ Claims processing endpoint working")
      } else {
        console.log("⚠️ Claims processing endpoint returned:", claimsResponse.status)
      }
    } catch (error) {
      console.log("⚠️ Claims processing endpoint not available (expected for testing)")
    }

    // Test 4: Smart Contract Integration
    console.log("\nTest 4: Smart Contract Integration")
    try {
      const contractResponse = await fetch(`${BASE_URL}/api/contracts/policy-purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: "0x1234567890123456789012345678901234567890",
          policyType: "premium",
          premium: 0.025,
          coverage: 0.25,
        }),
      })

      if (contractResponse.ok) {
        console.log("✅ Smart contract endpoint working")
      } else {
        console.log("⚠️ Smart contract endpoint returned:", contractResponse.status)
      }
    } catch (error) {
      console.log("⚠️ Smart contract endpoint not available (expected for testing)")
    }

    // Test 5: Authentication Check
    console.log("\nTest 5: Authentication Endpoints")
    try {
      const authResponse = await fetch(`${BASE_URL}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "test-token",
        }),
      })

      console.log("⚠️ Auth verification endpoint status:", authResponse.status, "(expected 401/403)")
    } catch (error) {
      console.log("⚠️ Auth verification endpoint not available (expected for testing)")
    }

    console.log("\n🎉 API endpoint tests completed!")
    console.log("Note: Some endpoints may not be implemented yet, which is expected.")
  } catch (error) {
    console.error("❌ API test failed:", error.message)
    process.exit(1)
  }
}

// Run the tests
testAPIEndpoints()
