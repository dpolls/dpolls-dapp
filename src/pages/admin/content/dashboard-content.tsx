
import { SendUserOpContext } from '@/contexts';
import { useContext, useEffect, useState } from "react";

import ActivePolls from '@/pages/admin/content/active-polls';
import ClaimingPolls from '@/pages/admin/content/claiming-polls';
import FundingPolls from '@/pages/admin/content/funding-polls';
import ManagePolls from '@/pages/admin/content/manage-polls';
import LeaderboardPage from '@/pages/leaderboard/page';
import CreatePoll from "@/pages/simple/create-poll";
import CompletedPolls from './completed-polls';


import { Button } from "@/components/ui_v3/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v3/card";
import { Progress } from "@/components/ui_v3/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_v3/tabs";
import { POLLS_DAPP_ABI, } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import { useConfig, useSignature } from '@/hooks';
import { PollState } from '@/types/poll';
import { convertTimestampToDate } from '@/utils/format';
import { ethers } from 'ethers';
import { BarChart, Dice5, LineChart, Mail, PieChart, Trophy } from "lucide-react";

interface DashboardContentProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function DashboardContent({ activeTab, setActiveTab }: DashboardContentProps) {
  const [activeDashboardTab, setActiveDashboardTab] = useState('active');
  const { AAaddress, isConnected, simpleAccountInstance } = useSignature();

  const config = useConfig(); // Get config to access RPC URL
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string>('');
  const [polls, setPolls] = useState<any[]>([]);

  const { isWalletPanel, setIsWalletPanel } = useContext(SendUserOpContext)!
  const [isWalletConnected, setIsWalletConnected] = useState(false)

  useEffect(() => {
    if (!isWalletConnected) {
      setIsWalletPanel(false)
    }
  }, [isWalletConnected, setIsWalletPanel])

  useEffect(() => {
    if (isConnected) {
      fetchPolls();
    }
  }, [isConnected]); 

  const fetchPolls = async () => {
    if (!isConnected || !AAaddress) return;

    try {
      setIsLoading(true);
      
      // Create a provider using the RPC URL from config
      const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
      
      // Create a contract instance for the NFT contract
      const pollsContract = new ethers.Contract(
        CONTRACT_ADDRESSES.dpollsContract,
        POLLS_DAPP_ABI,
        provider
      );
      
      // Get all poll IDs
      const allPollIds = await pollsContract.getAllPollIds();
      if (allPollIds.length > 0) {
        const fetchedPolls: PollState[] = await Promise.all(
          allPollIds.map(async (pollId: number) => {
            try {
              // Get poll details using the polls function
              const pollDetails = await pollsContract.getPoll(pollId);
              const pollResponses = await pollsContract.getPollResponses(pollId);
              const modPollResponses = pollResponses?.map((response: any) => {
                return response.response
              });
              const pollResonsesWithAddress = pollResponses?.map((response: any) => {
                return {
                  address: response.responder,
                  response: response.response,
                  isClaimed: response.isClaimed,
                  weight: response.weight,
                  timestamp: convertTimestampToDate(Number(response.timestamp)),
                  reward: response.reward
                }
              });

              // Format the poll data
              const result = {
                id: pollId,
                creator: pollDetails.creator,
                subject: pollDetails.subject,
                description: pollDetails.description,
                category: pollDetails.category,
                status: pollDetails.status,
                createdAt: new Date(Number(pollDetails.endTime) * 1000 - Number(pollDetails.durationDays) * 24 * 60 * 60 * 1000),
                options: pollDetails.options,
                rewardPerResponse: pollDetails.rewardPerResponse,
                maxResponses: pollDetails.maxResponses.toString(),
                endDate: new Date(Number(pollDetails.endTime) * 1000),
                isOpen: pollDetails.isOpen,
                totalResponses: pollResonsesWithAddress.length,
                funds: pollDetails.funds,
                minContribution: pollDetails.minContribution,
                targetFund: pollDetails.targetFund,
                responses: modPollResponses,
                responsesWithAddress: pollResonsesWithAddress
              };
              console.log('poll mod data', result);

              return result;
            } catch (error) {
              console.error(`Error fetching Poll #${pollId}:`, error);
              return null;
            }
          })
        );

        // Filter out any null values from failed fetches
        const validPolls = fetchedPolls.filter(poll => poll !== null);
        
        if (validPolls.length > 0) {
          setPolls(validPolls);
          setTxStatus(`Found ${validPolls.length} Polls`);
        } else {
          setTxStatus('No valid polls found');
          // Show sample polls as fallback
          setPolls([]);
        }
      } else {
        setTxStatus('No polls found');
        setPolls([]);
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
      setTxStatus('Error fetching polls');
      
      // Fallback to sample polls in case of error
      setPolls([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Render different content based on active tab
  if (activeTab === "create-poll") {
    //return <CreatePollContent />
    return <CreatePoll />
  } else if (activeTab === "created-polls") {
    return (
      <ManagePolls
        AAaddress={AAaddress}
        handleTabChange={setActiveTab}
        polls={polls}
        fetchPolls={fetchPolls} 
        isWalletConnected={isWalletConnected}
        setIsWalletConnected={setIsWalletConnected}
      />
    )
  } else if (activeTab === "active-polls") {
    return (
      <ActivePolls
        AAaddress={AAaddress}
        handleTabChange={setActiveTab}
        polls={polls}
        fetchPolls={fetchPolls}
        isWalletConnected={isWalletConnected}
        setIsWalletConnected={setIsWalletConnected}
      />
    )
  } else if (activeTab === "funding-polls") {
    return (
      <FundingPolls
        polls={polls} handleTabChange={setActiveTab} fetchPolls={fetchPolls} 
        isWalletConnected={isWalletConnected}
        setIsWalletConnected={setIsWalletConnected}
      />
    )
  } else if (activeTab === "claiming") {
    return (
      <ClaimingPolls
        AAaddress={AAaddress} handleTabChange={setActiveTab} polls={polls} fetchPolls={fetchPolls}
        isWalletConnected={isWalletConnected}
        setIsWalletConnected={setIsWalletConnected}
      />
    );
  } else if (activeTab === "completed-polls") {
    return <CompletedPolls AAaddress={AAaddress} handleTabChange={setActiveTab} polls={polls} fetchPolls={fetchPolls} />
  } else if (activeTab === "settings") {
    return <SettingsContent />
  } else if (activeTab === "games") {
    return <GamesContent />
  } else if (activeTab === "leaderboard") {
    return <LeaderboardPage AAaddress={AAaddress} polls={polls} fetchPolls={fetchPolls} />
    //return <LeaderboardContent />
  } else {
    return <OverviewContent />
  }
}

function OverviewContent() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dashboard Overview</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">+1 from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground">+342 from last week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Polls</CardTitle>
            <CardDescription>Your most recently created polls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Game Night Preferences", responses: 42, completion: 65 },
                { name: "Team Building Activities", responses: 28, completion: 40 },
                { name: "Office Lunch Options", responses: 56, completion: 80 },
                { name: "Remote Work Survey", responses: 19, completion: 25 },
              ].map((poll, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{poll.name}</p>
                    <p className="text-xs text-muted-foreground">{poll.responses} responses</p>
                  </div>
                  <div className="w-1/3">
                    <Progress value={poll.completion} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Poll Performance</CardTitle>
            <CardDescription>Response rates for active polls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              Chart visualization would go here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CreatePollContent() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Create New Poll</h2>

      <Card>
        <CardHeader>
          <CardTitle>Poll Details</CardTitle>
          <CardDescription>Enter the basic information for your new poll</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Poll Title
              </label>
              <input id="title" className="w-full p-2 rounded-md border" placeholder="Enter poll title" />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                className="w-full p-2 rounded-md border min-h-[100px]"
                placeholder="Enter poll description"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Poll Type</label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input type="radio" id="single" name="pollType" />
                  <label htmlFor="single">Single Choice</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="radio" id="multiple" name="pollType" />
                  <label htmlFor="multiple">Multiple Choice</label>
                </div>
              </div>
            </div>

            <Button>Continue to Questions</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsContent() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Settings</h2>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Manage your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <input id="name" className="w-full p-2 rounded-md border" defaultValue="John Doe" />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full p-2 rounded-md border"
                  defaultValue="john.doe@example.com"
                />
              </div>

              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive poll updates via email</p>
                  </div>
                  <div className="h-6 w-11 bg-muted rounded-full relative cursor-pointer">
                    <div className="h-5 w-5 bg-primary rounded-full absolute top-0.5 right-0.5"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive poll updates via push notifications</p>
                  </div>
                  <div className="h-6 w-11 bg-muted rounded-full relative cursor-pointer">
                    <div className="h-5 w-5 bg-background border rounded-full absolute top-0.5 left-0.5"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize how the application looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium mb-2">Theme</p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      Light
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Dark
                    </Button>
                    <Button variant="outline" className="flex-1">
                      System
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Configure advanced options</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Advanced settings content would go here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GamesContent() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Games</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Envelope Game</CardTitle>
            <CardDescription>Interactive envelope game for poll participants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
              <Mail className="h-12 w-12 text-muted-foreground" />
            </div>
            <Button className="w-full mt-4">Play Game</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>D&D Games</CardTitle>
            <CardDescription>Dungeons & Dragons themed poll games</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
              <Dice5 className="h-12 w-12 text-muted-foreground" />
            </div>
            <Button className="w-full mt-4">Explore Games</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LeaderboardContent() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Leaderboard</h2>

      <Card>
        <CardHeader>
          <CardTitle>Top Poll Participants</CardTitle>
          <CardDescription>Users with the most poll responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Alex Johnson", responses: 124, rank: 1 },
              { name: "Maria Garcia", responses: 98, rank: 2 },
              { name: "David Kim", responses: 87, rank: 3 },
              { name: "Sarah Williams", responses: 76, rank: 4 },
              { name: "James Brown", responses: 65, rank: 5 },
            ].map((user, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      user.rank === 1
                        ? "bg-yellow-100 text-yellow-600"
                        : user.rank === 2
                          ? "bg-gray-100 text-gray-600"
                          : user.rank === 3
                            ? "bg-amber-100 text-amber-600"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {user.rank}
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.responses} responses</p>
                  </div>
                </div>
                <Trophy
                  className={`h-5 w-5 ${
                    user.rank === 1
                      ? "text-yellow-500"
                      : user.rank === 2
                        ? "text-gray-400"
                        : user.rank === 3
                          ? "text-amber-500"
                          : "text-muted-foreground"
                  }`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
