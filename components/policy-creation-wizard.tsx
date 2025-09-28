"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Shield,
  DollarSign,
  Calendar,
  MapPin,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { useWallet } from "@/lib/wallet/wallet-context"
import { toast } from "sonner"

interface PolicyType {
  id: string
  name: string
  description: string
  category: string
  base_premium: number
  max_payout: number
  duration_options: string[]
  oracle_types: string[]
  is_active: boolean
}

interface PolicyCreationWizardProps {
  isOpen: boolean
  onClose: () => void
  onPolicyCreated: (policy: any) => void
}

export function PolicyCreationWizard({ isOpen, onClose, onPolicyCreated }: PolicyCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [policyTypes, setPolicyTypes] = useState<PolicyType[]>([])
  const [formData, setFormData] = useState({
    policyTypeId: "",
    duration: "",
    location: "",
    customConditions: "",
    premiumAmount: 0,
    payoutAmount: 0,
  })
  const [selectedPolicyType, setSelectedPolicyType] = useState<PolicyType | null>(null)
  const { address, isConnected } = useWallet()

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  useEffect(() => {
    if (isOpen) {
      loadPolicyTypes()
    }
  }, [isOpen])

  const loadPolicyTypes = async () => {
    try {
      const response = await fetch("/api/policies")
      if (response.ok) {
        const types = await response.json()
        setPolicyTypes(types)
      }
    } catch (error) {
      console.error("Failed to load policy types:", error)
      toast.error("Failed to load policy types")
    }
  }

  const handlePolicyTypeSelect = (policyTypeId: string) => {
    const policyType = policyTypes.find((p) => p.id === policyTypeId)
    if (policyType) {
      setSelectedPolicyType(policyType)
      setFormData((prev) => ({
        ...prev,
        policyTypeId,
        premiumAmount: policyType.base_premium,
        payoutAmount: policyType.max_payout,
      }))
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!address || !isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!selectedPolicyType) {
      toast.error("Please select a policy type")
      return
    }

    setIsLoading(true)
    try {
      // Mock blockchain transaction
      console.log("[v0] Creating policy on blockchain...")
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const policyData = {
        policyTypeId: formData.policyTypeId,
        userAddress: address,
        premiumAmount: formData.premiumAmount,
        payoutAmount: formData.payoutAmount,
        duration: formData.duration,
        location: formData.location,
        conditions: formData.customConditions || selectedPolicyType.description,
        oracleConditions: {
          type: selectedPolicyType.category,
          oracles: selectedPolicyType.oracle_types,
        },
        contractAddress: "0x" + Math.random().toString(16).substr(2, 40),
        tokenId: "policy_" + Date.now(),
      }

      const response = await fetch("/api/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(policyData),
      })

      if (!response.ok) {
        throw new Error("Failed to create policy")
      }

      const newPolicy = await response.json()
      toast.success("Policy created successfully!")
      onPolicyCreated(newPolicy)
      onClose()
      resetForm()
    } catch (error) {
      console.error("Policy creation error:", error)
      toast.error("Failed to create policy")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setFormData({
      policyTypeId: "",
      duration: "",
      location: "",
      customConditions: "",
      premiumAmount: 0,
      payoutAmount: 0,
    })
    setSelectedPolicyType(null)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.policyTypeId !== ""
      case 2:
        return formData.duration !== ""
      case 3:
        return true // Optional step
      case 4:
        return true // Review step
      default:
        return false
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Create New Policy</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Follow the steps to create your custom insurance policy
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Step {currentStep} of {totalSteps}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step 1: Policy Type Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Select Policy Type</h3>
                <p className="text-sm text-muted-foreground mb-4">Choose the type of insurance coverage you need</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {policyTypes.map((policyType) => (
                  <Card
                    key={policyType.id}
                    className={`cursor-pointer transition-colors ${
                      formData.policyTypeId === policyType.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handlePolicyTypeSelect(policyType.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{policyType.name}</CardTitle>
                        <Badge variant="secondary">{policyType.category}</Badge>
                      </div>
                      <CardDescription className="text-sm">{policyType.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Base Premium:</span>
                        <span className="font-medium">${policyType.base_premium}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Max Payout:</span>
                        <span className="font-medium">${policyType.max_payout}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Duration and Coverage */}
          {currentStep === 2 && selectedPolicyType && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Coverage Details</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure your policy duration and coverage amounts
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Policy Duration</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, duration: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedPolicyType.duration_options.map((duration) => (
                        <SelectItem key={duration} value={duration}>
                          {duration}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="e.g., New York, USA"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Premium Amount</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={formData.premiumAmount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          premiumAmount: Number.parseFloat(e.target.value) || 0,
                        }))
                      }
                      min={selectedPolicyType.base_premium}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payout Amount</Label>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={formData.payoutAmount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          payoutAmount: Number.parseFloat(e.target.value) || 0,
                        }))
                      }
                      max={selectedPolicyType.max_payout}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Custom Conditions */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Custom Conditions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add any specific conditions or requirements for your policy
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="conditions">Additional Conditions (Optional)</Label>
                  <Textarea
                    id="conditions"
                    placeholder="Describe any specific conditions or requirements..."
                    value={formData.customConditions}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customConditions: e.target.value }))}
                    rows={4}
                  />
                </div>

                {selectedPolicyType && (
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Default Conditions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{selectedPolicyType.description}</p>
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Oracle Types:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedPolicyType.oracle_types.map((oracle) => (
                            <Badge key={oracle} variant="outline" className="text-xs">
                              {oracle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review and Confirm */}
          {currentStep === 4 && selectedPolicyType && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Review Your Policy</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please review all details before creating your policy
                </p>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {selectedPolicyType.name}
                  </CardTitle>
                  <CardDescription>{selectedPolicyType.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Premium</div>
                      <div className="text-lg font-semibold">${formData.premiumAmount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Coverage</div>
                      <div className="text-lg font-semibold">${formData.payoutAmount}</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{formData.duration}</span>
                    </div>
                    {formData.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Location:</span>
                        <span>{formData.location}</span>
                      </div>
                    )}
                  </div>

                  {formData.customConditions && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileText className="h-4 w-4" />
                          Custom Conditions
                        </div>
                        <p className="text-sm text-muted-foreground">{formData.customConditions}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {!isConnected && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                  <span className="text-sm text-orange-400">Please connect your wallet to create the policy</span>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading || !isConnected}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Create Policy
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
