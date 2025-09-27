"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TestingUtils, TEST_SCENARIOS } from "@/lib/testing/test-utils"
import { Play, CheckCircle, XCircle, Clock, Zap } from "lucide-react"

interface TestResult {
  name: string
  status: "pending" | "running" | "success" | "error"
  message?: string
  duration?: number
}

export default function TestingPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    const startTime = Date.now()

    setTestResults((prev) => [
      ...prev,
      {
        name: testName,
        status: "running",
      },
    ])

    try {
      await testFunction()
      const duration = Date.now() - startTime

      setTestResults((prev) =>
        prev.map((result) =>
          result.name === testName
            ? { ...result, status: "success", duration, message: "Test passed successfully" }
            : result,
        ),
      )
    } catch (error) {
      const duration = Date.now() - startTime

      setTestResults((prev) =>
        prev.map((result) =>
          result.name === testName
            ? {
                ...result,
                status: "error",
                duration,
                message: error instanceof Error ? error.message : "Test failed",
              }
            : result,
        ),
      )
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])

    const tests = [
      {
        name: "Identity Verification",
        fn: TestingUtils.simulateIdentityVerification,
      },
      {
        name: "Policy Purchase",
        fn: () => TestingUtils.simulatePolicyPurchase("flight_delay", 50),
      },
      {
        name: "Flight Delay Oracle",
        fn: () => TestingUtils.simulateOracleEvent("flight_delay"),
      },
      {
        name: "Weather Oracle",
        fn: () => TestingUtils.simulateOracleEvent("weather"),
      },
      {
        name: "Automatic Payout",
        fn: () => TestingUtils.simulateAutomaticPayout(12345, 1000),
      },
      {
        name: "Complete Flow",
        fn: TEST_SCENARIOS.completeFlow,
      },
    ]

    for (const test of tests) {
      await runTest(test.name, test.fn)
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "running":
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "running":
        return (
          <Badge variant="outline" className="text-blue-600">
            Running
          </Badge>
        )
      case "success":
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>
      case "error":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Protocol Testing Suite</h1>
          <p className="text-muted-foreground">
            Test all components of the insurance protocol including Self SDK integration, smart contracts, and oracle
            functionality
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Test Suite
              </CardTitle>
              <CardDescription>Run comprehensive tests for the insurance protocol</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={runAllTests} disabled={isRunning} className="w-full" size="lg">
                <Play className="h-4 w-4 mr-2" />
                {isRunning ? "Running Tests..." : "Run All Tests"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Coverage</CardTitle>
              <CardDescription>Components being tested</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Self SDK Identity Verification</li>
                <li>• Smart Contract Integration</li>
                <li>• Chainlink Oracle Monitoring</li>
                <li>• Automatic Payout System</li>
                <li>• End-to-End User Flow</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Real-time test execution results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <p className="font-medium">{result.name}</p>
                          {result.message && <p className="text-sm text-muted-foreground">{result.message}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.duration && <span className="text-sm text-muted-foreground">{result.duration}ms</span>}
                        {getStatusBadge(result.status)}
                      </div>
                    </div>
                    {index < testResults.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Testing Environment</CardTitle>
            <CardDescription>Current testing configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Network</p>
                <p className="text-muted-foreground">Celo Alfajores Testnet</p>
              </div>
              <div>
                <p className="font-medium">Self SDK</p>
                <p className="text-muted-foreground">Simulation Mode</p>
              </div>
              <div>
                <p className="font-medium">Oracle</p>
                <p className="text-muted-foreground">Mock Chainlink Data</p>
              </div>
              <div>
                <p className="font-medium">Contracts</p>
                <p className="text-muted-foreground">Test Deployment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
