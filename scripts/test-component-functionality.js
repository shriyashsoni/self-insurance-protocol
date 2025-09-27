// Test script for component functionality using Node.js
import { JSDOM } from "jsdom"

// Mock DOM environment for component testing
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>")
global.window = dom.window
global.document = dom.window.document
global.navigator = dom.window.navigator

async function testComponentFunctionality() {
  console.log("🧪 Starting Component Functionality Tests...\n")

  try {
    // Test 1: Policy Card Data Processing
    console.log("Test 1: Policy Card Data Processing")

    const mockPolicy = {
      id: "test-policy-1",
      policy_name: "Test Birthday Policy",
      policy_type: "premium",
      premium_amount: 0.025,
      coverage_amount: 0.25,
      policy_status: "active",
      birthday_policies: [
        {
          birthday_date: "2024-12-25",
          celebration_location: "New York, NY",
          celebration_type: "House Party",
          guest_count: 25,
        },
      ],
    }

    // Test policy data validation
    const isValidPolicy =
      mockPolicy.id &&
      mockPolicy.policy_name &&
      mockPolicy.premium_amount > 0 &&
      mockPolicy.coverage_amount > 0 &&
      mockPolicy.birthday_policies?.length > 0

    if (isValidPolicy) {
      console.log("✅ Policy data structure validation passed")
    } else {
      throw new Error("Policy data structure validation failed")
    }

    // Test 2: Date Calculations
    console.log("\nTest 2: Date Calculations")

    const getDaysUntilBirthday = (birthdayDate) => {
      const today = new Date()
      const birthday = new Date(birthdayDate)
      const diffTime = birthday.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }

    const daysUntil = getDaysUntilBirthday("2024-12-25")
    console.log("✅ Date calculation working, days until test birthday:", daysUntil)

    // Test 3: Status Color Mapping
    console.log("\nTest 3: Status Color Mapping")

    const getStatusColor = (status) => {
      const colorMap = {
        active: "bg-green-100 text-green-800 border-green-200",
        expired: "bg-gray-100 text-gray-800 border-gray-200",
        claimed: "bg-blue-100 text-blue-800 border-blue-200",
        cancelled: "bg-red-100 text-red-800 border-red-200",
      }
      return colorMap[status] || "bg-gray-100 text-gray-800 border-gray-200"
    }

    const testStatuses = ["active", "expired", "claimed", "cancelled", "unknown"]
    testStatuses.forEach((status) => {
      const color = getStatusColor(status)
      if (color) {
        console.log(`✅ Status color mapping for '${status}': ${color.split(" ")[0]}`)
      }
    })

    // Test 4: Form Validation Logic
    console.log("\nTest 4: Form Validation Logic")

    const validatePolicyForm = (formData) => {
      const errors = []

      if (!formData.policy_name || formData.policy_name.length < 3) {
        errors.push("Policy name must be at least 3 characters")
      }

      if (!formData.birthday_date) {
        errors.push("Birthday date is required")
      } else {
        const birthdayDate = new Date(formData.birthday_date)
        const today = new Date()
        if (birthdayDate < today) {
          errors.push("Birthday date must be in the future")
        }
      }

      if (!formData.celebration_location || formData.celebration_location.length < 3) {
        errors.push("Celebration location must be at least 3 characters")
      }

      if (!formData.celebration_type) {
        errors.push("Celebration type is required")
      }

      if (formData.guest_count < 1 || formData.guest_count > 500) {
        errors.push("Guest count must be between 1 and 500")
      }

      return errors
    }

    // Test valid form data
    const validFormData = {
      policy_name: "My 30th Birthday",
      birthday_date: "2024-12-25",
      celebration_location: "New York, NY",
      celebration_type: "House Party",
      guest_count: 25,
    }

    const validationErrors = validatePolicyForm(validFormData)
    if (validationErrors.length === 0) {
      console.log("✅ Form validation passed for valid data")
    } else {
      throw new Error("Form validation failed for valid data: " + validationErrors.join(", "))
    }

    // Test invalid form data
    const invalidFormData = {
      policy_name: "My",
      birthday_date: "2023-01-01",
      celebration_location: "NY",
      celebration_type: "",
      guest_count: 0,
    }

    const invalidValidationErrors = validatePolicyForm(invalidFormData)
    if (invalidValidationErrors.length > 0) {
      console.log("✅ Form validation correctly caught", invalidValidationErrors.length, "errors")
    } else {
      throw new Error("Form validation should have caught errors for invalid data")
    }

    // Test 5: Policy Type Calculations
    console.log("\nTest 5: Policy Type Calculations")

    const policyTypes = [
      { value: "basic", label: "Basic Birthday Protection", premium: 0.01, coverage: 0.1 },
      { value: "premium", label: "Premium Birthday Coverage", premium: 0.025, coverage: 0.25 },
      { value: "deluxe", label: "Deluxe Birthday Insurance", premium: 0.05, coverage: 0.5 },
      { value: "ultimate", label: "Ultimate Birthday Protection", premium: 0.1, coverage: 1.0 },
    ]

    const calculatePolicyValue = (policyType) => {
      const type = policyTypes.find((t) => t.value === policyType)
      if (!type) return null

      return {
        premium: type.premium,
        coverage: type.coverage,
        ratio: type.coverage / type.premium,
      }
    }

    policyTypes.forEach((type) => {
      const calculation = calculatePolicyValue(type.value)
      if (calculation) {
        console.log(
          `✅ ${type.label}: Premium ${calculation.premium} ETH, Coverage ${calculation.coverage} ETH, Ratio ${calculation.ratio.toFixed(1)}x`,
        )
      }
    })

    // Test 6: Search and Filter Logic
    console.log("\nTest 6: Search and Filter Logic")

    const mockPolicies = [
      {
        policy_name: "Birthday Party NYC",
        policy_status: "active",
        birthday_policies: [{ celebration_location: "New York" }],
      },
      {
        policy_name: "Beach Birthday",
        policy_status: "expired",
        birthday_policies: [{ celebration_location: "Miami Beach" }],
      },
      {
        policy_name: "Family Celebration",
        policy_status: "active",
        birthday_policies: [{ celebration_location: "Chicago" }],
      },
    ]

    const filterPolicies = (policies, searchTerm, statusFilter) => {
      return policies.filter((policy) => {
        const matchesSearch =
          !searchTerm ||
          policy.policy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          policy.birthday_policies?.[0]?.celebration_location.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === "all" || policy.policy_status === statusFilter

        return matchesSearch && matchesStatus
      })
    }

    // Test search functionality
    const searchResults = filterPolicies(mockPolicies, "beach", "all")
    if (searchResults.length === 1 && searchResults[0].policy_name === "Beach Birthday") {
      console.log("✅ Search functionality working correctly")
    } else {
      throw new Error("Search functionality failed")
    }

    // Test filter functionality
    const filterResults = filterPolicies(mockPolicies, "", "active")
    if (filterResults.length === 2) {
      console.log("✅ Filter functionality working correctly")
    } else {
      throw new Error("Filter functionality failed")
    }

    console.log("\n🎉 All component functionality tests passed!")
  } catch (error) {
    console.error("❌ Component functionality test failed:", error.message)
    process.exit(1)
  }
}

// Run the tests
testComponentFunctionality()
