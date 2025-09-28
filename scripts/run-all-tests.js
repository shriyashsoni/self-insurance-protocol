// Master test runner script
import { spawn } from "child_process"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const testFiles = [
  "test-database-operations.js",
  "test-api-endpoints.js",
  "test-component-functionality.js",
  "test-integration-flows.js",
]

async function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n${"=".repeat(60)}`)
    console.log(`🚀 Running ${testFile}`)
    console.log(`${"=".repeat(60)}`)

    const testPath = join(__dirname, testFile)
    const child = spawn("node", [testPath], {
      stdio: "inherit",
      env: { ...process.env },
    })

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`\n✅ ${testFile} completed successfully`)
        resolve()
      } else {
        console.log(`\n❌ ${testFile} failed with code ${code}`)
        reject(new Error(`Test ${testFile} failed`))
      }
    })

    child.on("error", (error) => {
      console.error(`\n❌ Failed to run ${testFile}:`, error.message)
      reject(error)
    })
  })
}

async function runAllTests() {
  console.log("🧪 Birthday Insurance Protocol - Comprehensive Test Suite")
  console.log("=".repeat(80))

  const startTime = Date.now()
  let passedTests = 0
  let failedTests = 0

  for (const testFile of testFiles) {
    try {
      await runTest(testFile)
      passedTests++
    } catch (error) {
      failedTests++
      console.error(`Test suite ${testFile} failed:`, error.message)

      // Continue with other tests even if one fails
      console.log("Continuing with remaining tests...")
    }
  }

  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)

  console.log("\n" + "=".repeat(80))
  console.log("🏁 TEST SUITE SUMMARY")
  console.log("=".repeat(80))
  console.log(`⏱️  Total Duration: ${duration} seconds`)
  console.log(`✅ Passed Tests: ${passedTests}/${testFiles.length}`)
  console.log(`❌ Failed Tests: ${failedTests}/${testFiles.length}`)

  if (failedTests === 0) {
    console.log("\n🎉 ALL TESTS PASSED! The Birthday Insurance Protocol is ready for deployment.")
  } else {
    console.log(`\n⚠️  ${failedTests} test suite(s) had issues. Please review the output above.`)
    console.log("Note: Some failures may be expected if certain API endpoints are not yet implemented.")
  }

  console.log("\n📋 Test Coverage:")
  console.log("   🗄️  Database Operations")
  console.log("   🌐 API Endpoints")
  console.log("   🧩 Component Functionality")
  console.log("   🔄 Integration Flows")

  console.log("\n🔧 To run individual test suites:")
  testFiles.forEach((file) => {
    console.log(`   node scripts/${file}`)
  })
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n\n⏹️  Test suite interrupted by user")
  process.exit(0)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  process.exit(1)
})

// Run all tests
runAllTests().catch((error) => {
  console.error("Fatal error running test suite:", error)
  process.exit(1)
})
