"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Clock, Users, ExternalLink, Share2, Flag, AlertCircle } from "lucide-react"

export default function VotePage() {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState("")
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  const handleVote = () => {
    setIsVoting(true)
    // Simulate blockchain transaction
    setTimeout(() => {
      setIsVoting(false)
      setHasVoted(true)
    }, 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" className="mb-6 gap-2" onClick={() => router.push("/dashboard")}>
        <ArrowLeft className="h-4 w-4" />
        Back to Polls
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <Badge variant="default" className="mb-2 bg-green-500">
                Active
              </Badge>
              <CardTitle className="text-2xl">Should we integrate with Arbitrum?</CardTitle>
              <CardDescription className="mt-2">
                Vote on whether our protocol should expand to the Arbitrum network for lower gas fees and faster
                transactions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Ends in 2 days</span>
              <span className="mx-1 text-muted-foreground">•</span>
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">342 votes</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Share2 className="h-3 w-3" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <ExternalLink className="h-3 w-3" />
                View on Explorer
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          {!hasVoted ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Cast your vote</h3>
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                <div className="space-y-3">
                  {pollOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-center space-x-2 rounded-lg border p-4 transition-colors ${
                        selectedOption === option.id ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer font-medium">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              <div className="rounded-lg border p-4 bg-muted/50 mt-6">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p>Your vote will be recorded on the blockchain and cannot be changed once submitted.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <div className="flex gap-2">
                  <div className="text-sm text-green-800 dark:text-green-400">
                    <p className="font-medium">Vote successfully recorded!</p>
                    <p>Your vote has been recorded on the blockchain. Transaction hash: 0x71C...93A4</p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-medium">Current Results</h3>

              <div className="space-y-4">
                {pollOptions.map((option) => (
                  <div key={option.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className={`${option.id === "yes-asap" ? "font-medium" : ""}`}>
                        {option.text}
                        {option.id === "yes-asap" && " (Your vote)"}
                      </Label>
                      <span className="text-sm font-medium">{option.percentage}%</span>
                    </div>
                    <Progress value={option.percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{option.votes} votes</span>
                      <span>{option.tokenAmount} tokens</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 border-t p-6">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`/placeholder.svg?height=32&width=32`} alt="Creator" />
              <AvatarFallback>CR</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Created by</p>
              <p className="text-xs text-muted-foreground">0x71C...93A4</p>
            </div>
          </div>

          {!hasVoted ? (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-initial gap-1">
                <Flag className="h-4 w-4" />
                Report
              </Button>
              <Button className="flex-1 sm:flex-initial" disabled={!selectedOption || isVoting} onClick={handleVote}>
                {isVoting ? "Submitting Vote..." : "Submit Vote"}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Poll Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Poll ID</p>
              <p className="text-sm">0x8f72...3e91</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">May 4, 2025</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">End Date</p>
              <p className="text-sm">May 8, 2025</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <p className="text-sm">Governance</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Voting System</p>
              <p className="text-sm">Token-weighted</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Visibility</p>
              <p className="text-sm">Public</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const pollOptions = [
  {
    id: "yes-asap",
    text: "Yes, ASAP",
    percentage: 65,
    votes: 223,
    tokenAmount: "1.2M",
  },
  {
    id: "yes-later",
    text: "Yes, but later",
    percentage: 20,
    votes: 68,
    tokenAmount: "380K",
  },
  {
    id: "no",
    text: "No",
    percentage: 10,
    votes: 34,
    tokenAmount: "190K",
  },
  {
    id: "undecided",
    text: "Undecided",
    percentage: 5,
    votes: 17,
    tokenAmount: "95K",
  },
]