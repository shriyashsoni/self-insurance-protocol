// Test script for database operations
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseOperations() {
  console.log("🧪 Starting Database Operations Tests...\n")

  try {
    // Test 1: User Creation and Verification
    console.log("Test 1: User Operations")
    const testUserId = "test-user-" + Date.now()

    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: testUserId,
        wallet_address: "0x1234567890123456789012345678901234567890",
        self_verification_status: "verified",
        kyc_verified: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (userError) throw userError
    console.log("✅ User created successfully:", userData.id)

    // Test 2: Insurance Policy Creation
    console.log("\nTest 2: Insurance Policy Creation")
    const { data: policyData, error: policyError } = await supabase
      .from("insurance_policies")
      .insert({
        user_id: testUserId,
        policy_name: "Test Birthday Policy",
        policy_type: "premium",
        premium_amount: 0.025,
        coverage_amount: 0.25,
        policy_status: "active",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        policy_terms: {
          weather_protection: true,
          venue_protection: true,
          travel_protection: false,
          health_protection: true,
        },
      })
      .select()
      .single()

    if (policyError) throw policyError
    console.log("✅ Insurance policy created successfully:", policyData.id)

    // Test 3: Birthday Policy Details
    console.log("\nTest 3: Birthday Policy Details")
    const { data: birthdayData, error: birthdayError } = await supabase
      .from("birthday_policies")
      .insert({
        policy_id: policyData.id,
        birthday_date: "2024-12-25",
        celebration_location: "New York, NY",
        celebration_type: "House Party",
        guest_count: 25,
        weather_protection: true,
        venue_protection: true,
        travel_protection: false,
        health_protection: true,
      })
      .select()
      .single()

    if (birthdayError) throw birthdayError
    console.log("✅ Birthday policy details created successfully:", birthdayData.id)

    // Test 4: Claims Creation
    console.log("\nTest 4: Claims Processing")
    const { data: claimData, error: claimError } = await supabase
      .from("claims")
      .insert({
        user_id: testUserId,
        policy_id: policyData.id,
        claim_type: "weather_disruption",
        claim_amount: 0.1,
        claim_status: "pending",
        claim_description: "Severe weather prevented birthday celebration",
        evidence_data: {
          weather_report: "Heavy rain and thunderstorms",
          photos: ["evidence1.jpg", "evidence2.jpg"],
        },
      })
      .select()
      .single()

    if (claimError) throw claimError
    console.log("✅ Claim created successfully:", claimData.id)

    // Test 5: Oracle Monitoring Setup
    console.log("\nTest 5: Oracle Monitoring")
    const { data: oracleData, error: oracleError } = await supabase
      .from("oracle_monitoring")
      .insert({
        policy_id: policyData.id,
        monitoring_type: "weather",
        monitoring_status: "active",
        trigger_conditions: {
          location: "New York, NY",
          weather_threshold: "severe_weather_warning",
          date_range: ["2024-12-24", "2024-12-26"],
        },
        last_check: new Date().toISOString(),
      })
      .select()
      .single()

    if (oracleError) throw oracleError
    console.log("✅ Oracle monitoring setup successfully:", oracleData.id)

    // Test 6: Smart Contract Transactions
    console.log("\nTest 6: Smart Contract Transactions")
    const { data: transactionData, error: transactionError } = await supabase
      .from("smart_contract_transactions")
      .insert({
        user_id: testUserId,
        policy_id: policyData.id,
        transaction_type: "policy_purchase",
        transaction_hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        contract_address: "0x9876543210987654321098765432109876543210",
        gas_used: 150000,
        gas_price: 20000000000,
        transaction_status: "confirmed",
        block_number: 18500000,
      })
      .select()
      .single()

    if (transactionError) throw transactionError
    console.log("✅ Smart contract transaction recorded successfully:", transactionData.id)

    // Test 7: Data Relationships Query
    console.log("\nTest 7: Complex Query with Relationships")
    const { data: complexData, error: complexError } = await supabase
      .from("insurance_policies")
      .select(`
        *,
        birthday_policies (*),
        claims (*),
        oracle_monitoring (*),
        smart_contract_transactions (*),
        users (wallet_address, self_verification_status)
      `)
      .eq("id", policyData.id)
      .single()

    if (complexError) throw complexError
    console.log("✅ Complex relationship query successful")
    console.log("   - Policy has", complexData.birthday_policies?.length || 0, "birthday details")
    console.log("   - Policy has", complexData.claims?.length || 0, "claims")
    console.log("   - Policy has", complexData.oracle_monitoring?.length || 0, "oracle monitors")
    console.log("   - Policy has", complexData.smart_contract_transactions?.length || 0, "transactions")

    // Cleanup Test Data
    console.log("\nCleaning up test data...")
    await supabase.from("smart_contract_transactions").delete().eq("user_id", testUserId)
    await supabase.from("oracle_monitoring").delete().eq("policy_id", policyData.id)
    await supabase.from("claims").delete().eq("user_id", testUserId)
    await supabase.from("birthday_policies").delete().eq("policy_id", policyData.id)
    await supabase.from("insurance_policies").delete().eq("user_id", testUserId)
    await supabase.from("users").delete().eq("id", testUserId)
    console.log("✅ Test data cleaned up successfully")

    console.log("\n🎉 All database tests passed successfully!")
  } catch (error) {
    console.error("❌ Database test failed:", error.message)
    console.error("Full error:", error)
    process.exit(1)
  }
}

// Run the tests
testDatabaseOperations()
