"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Clock, Users, ExternalLink, Share2, Download, BarChart3, ListFilter } from "lucide-react"

export default function ResultsPage() {
  const router = useRouter()

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
              <Badge variant="secondary">Ended</Badge>
              <CardTitle className="text-2xl mt-2">Community call frequency</CardTitle>
              <CardDescription className="mt-2">How often should we hold community calls?</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Ended 2 days ago</span>
              <span className="mx-1 text-muted-foreground">•</span>
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">203 votes</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Share2 className="h-3 w-3" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-3 w-3" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <ExternalLink className="h-3 w-3" />
                View on Explorer
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          <Tabs defaultValue="chart">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="chart" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Chart View
              </TabsTrigger>
              <TabsTrigger value="voters" className="gap-2">
                <ListFilter className="h-4 w-4" />
                Voter List
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Final Results</h3>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Passed
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.map((result) => (
                  <Card key={result.id} className={`overflow-hidden ${result.winner ? "border-primary" : ""}`}>
                    <div className={`h-1 w-full ${result.winner ? "bg-primary" : "bg-transparent"}`}></div>
                    <CardContent className="p-4">
                      <div className="text-center mb-4">
                        <span className="text-4xl font-bold">{result.percentage}%</span>
                        <p className="text-sm text-muted-foreground">{result.votes} votes</p>
                      </div>
                      <p className="text-center font-medium">{result.text}</p>
                      {result.winner && (
                        <Badge variant="outline" className="mt-2 w-full justify-center">
                          Winner
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted p-4">
                  <h4 className="font-medium">Vote Distribution</h4>
                </div>
                <div className="p-4">
                  <div className="h-64 flex items-end justify-around gap-4">
                    {results.map((result) => (
                      <div key={result.id} className="relative flex flex-col items-center">
                        <div
                          className={`w-16 ${result.winner ? "bg-primary" : "bg-primary/30"}`}
                          style={{ height: `${result.percentage * 2}px` }}
                        ></div>
                        <span className="mt-2 text-sm font-medium">{result.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="voters" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Voter List</h3>
                <p className="text-sm text-muted-foreground">203 total voters</p>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="grid grid-cols-3 bg-muted p-4 text-sm font-medium">
                  <div>Wallet</div>
                  <div>Vote</div>
                  <div className="text-right">Voting Power</div>
                </div>
                <div className="divide-y">
                  {voters.map((voter, index) => (
                    <div key={index} className="grid grid-cols-3 p-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={`/placeholder.svg?height=24&width=24`} alt="Voter" />
                          <AvatarFallback>{voter.address.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{voter.address}</span>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="font-normal">
                          {voter.vote}
                        </Badge>
                      </div>
                      <div className="text-right">{voter.power}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <Button variant="outline">Load More</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
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

          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
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
              <p className="text-sm">0x9e43...7f21</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">April 28, 2025</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">End Date</p>
              <p className="text-sm">May 4, 2025</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <p className="text-sm">Community</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Voting System</p>
              <p className="text-sm">Token-weighted</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quorum</p>
              <p className="text-sm">200,000 tokens (Reached)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const results = [
  {
    id: "weekly",
    text: "Weekly",
    percentage: 25,
    votes: 51,
    winner: false,
  },
  {
    id: "bi-weekly",
    text: "Bi-weekly",
    percentage: 60,
    votes: 122,
    winner: true,
  },
  {
    id: "monthly",
    text: "Monthly",
    percentage: 15,
    votes: 30,
    winner: false,
  },
]

const voters = [
  { address: "0x71C...93A4", vote: "Bi-weekly", power: "50,000 tokens" },
  { address: "0x45D...21B7", vote: "Bi-weekly", power: "32,500 tokens" },
  { address: "0x92F...76C1", vote: "Weekly", power: "25,000 tokens" },
  { address: "0x38A...F4E2", vote: "Monthly", power: "18,750 tokens" },
  { address: "0x59B...A3D1", vote: "Bi-weekly", power: "15,000 tokens" },
  { address: "0x83C...12E5", vote: "Weekly", power: "12,500 tokens" },
  { address: "0x47D...9F32", vote: "Bi-weekly", power: "10,000 tokens" },
  { address: "0x29A...B7C1", vote: "Bi-weekly", power: "8,500 tokens" },
]