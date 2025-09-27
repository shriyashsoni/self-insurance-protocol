"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Clock, CheckCircle, AlertCircle, ExternalLink, Loader2, DollarSign, Shield } from "lucide-react"

interface Transaction {
  id: string
  type: "premium_payment" | "policy_mint" | "claim_payout"
  status: "pending" | "confirmed" | "failed"
  hash?: string
  amount: number
  currency: string
  timestamp: string
  policyId?: string
  description: string
}

interface TransactionStatusProps {
  transactions?: Transaction[]
}

const mockTransactions: Transaction[] = [
  {
    id: "tx_1",
    type: "premium_payment",
    status: "confirmed",
    hash: "0x1234567890abcdef1234567890abcdef12345678",
    amount: 25,
    currency: "cUSD",
    timestamp: "2024-01-15T10:30:00Z",
    policyId: "policy_1",
    description: "Premium payment for Flight Delay Protection",
  },
  {
    id: "tx_2",
    type: "policy_mint",
    status: "confirmed",
    hash: "0xabcdef1234567890abcdef1234567890abcdef12",
    amount: 0,
    currency: "CELO",
    timestamp: "2024-01-15T10:31:00Z",
    policyId: "policy_1",
    description: "Policy SBT minted for Flight Delay Protection",
  },
  {
    id: "tx_3",
    type: "claim_payout",
    status: "pending",
    amount: 500,
    currency: "cUSD",
    timestamp: "2024-01-16T14:22:00Z",
    policyId: "policy_1",
    description: "Automatic payout for flight delay claim",
  },
]

export function TransactionStatus({ transactions = mockTransactions }: TransactionStatusProps) {
  const [txList, setTxList] = useState<Transaction[]>(transactions)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-accent" />
      case "pending":
        return <Clock className="h-4 w-4 text-orange-400" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-accent/10 text-accent border-accent/20"
      case "pending":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-muted-foreground border-muted"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "premium_payment":
        return <DollarSign className="h-4 w-4 text-blue-400" />
      case "policy_mint":
        return <Shield className="h-4 w-4 text-green-400" />
      case "claim_payout":
        return <CheckCircle className="h-4 w-4 text-purple-400" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    if (amount === 0) return "Gas fee"
    return `${amount} ${currency}`
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const openTransaction = (hash: string) => {
    window.open(`https://alfajores-blockscout.celo-testnet.org/tx/${hash}`, "_blank")
  }

  if (txList.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Transaction History</CardTitle>
          <CardDescription className="text-muted-foreground">
            Your insurance-related transactions will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No transactions yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Transaction History</CardTitle>
        <CardDescription className="text-muted-foreground">
          Track your insurance payments, policy minting, and claim payouts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {txList.map((tx, index) => (
          <div key={tx.id}>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getTypeIcon(tx.type)}
                  {getStatusIcon(tx.status)}
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{tx.description}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatTimestamp(tx.timestamp)}</span>
                    {tx.hash && (
                      <>
                        <span>•</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openTransaction(tx.hash!)}
                          className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                        >
                          View on Explorer
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-medium text-foreground">{formatAmount(tx.amount, tx.currency)}</p>
                  <Badge className={getStatusColor(tx.status)}>{tx.status}</Badge>
                </div>
              </div>
            </div>
            {index < txList.length - 1 && <Separator className="bg-border" />}
          </div>
        ))}

        <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-foreground">Transaction Security</h4>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• All transactions are secured by Celo blockchain</p>
            <p>• Smart contracts handle automatic payouts</p>
            <p>• Transaction history is immutable and transparent</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
