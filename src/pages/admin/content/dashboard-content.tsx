import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Legend as ChartLegend, Tooltip as ChartTooltip, BarController,
  LineController,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ChartLegend, ChartTooltip, BarController, LineController);

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_v3/tabs";
import { POLLS_DAPP_ABI, } from '@/constants/abi';
import { useConfig, useSignature } from '@/hooks';
import { PollState } from '@/types/poll';
import { convertTimestampToDate } from '@/utils/format';
import { calculateTimeLeft } from '@/utils/timeUtils';
import { ethers } from 'ethers';
import { Dice5, Mail, Trophy } from "lucide-react";
import { Chart } from 'react-chartjs-2';
import { useToast } from '@/components/ui_v3/use-toast';
import { PieChart as RePieChart, Pie, Cell, Tooltip } from 'recharts';
import type { ChartData, ChartOptions } from 'chart.js';
import { VotePollModal } from "@/components/modals/vote-poll-modal"

interface DashboardContentProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function DashboardContent({ activeTab, setActiveTab }: DashboardContentProps) {
  const { AAaddress, isConnected, simpleAccountInstance } = useSignature();

  const config = useConfig(); // Get config to access RPC URL
  const { toast } = useToast();
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

    if (!config?.chains[config?.currentNetworkIndex]?.dpolls?.contractAddress) {
      toast({
        title: "Error",
        description: "Contract address not configured",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create a provider using the RPC URL from config
      const provider = new ethers.providers.JsonRpcProvider(config.chains[config.currentNetworkIndex].chain.rpc);
      
      // Create a contract instance for the NFT contract
      const pollsContract = new ethers.Contract(
        config.chains[config.currentNetworkIndex].dpolls.contractAddress,
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
                rewardPerResponse: pollDetails.rewardPerResponse.toString(),
                maxResponses: pollDetails.maxResponses.toString(),
                endDate: new Date(Number(pollDetails.endTime) * 1000),
                isOpen: pollDetails.isOpen,
                totalResponses: pollDetails.totalResponses.toString(),
                funds: pollDetails.funds.toString(),
                minContribution: pollDetails.minContribution.toString(),
                targetFund: pollDetails.targetFund.toString(),
                responses: modPollResponses,
                responsesWithAddress: pollResonsesWithAddress
              };

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
    return <CompletedPolls AAaddress={AAaddress} handleTabChange={setActiveTab} polls={polls} fetchPolls={fetchPolls} isWalletConnected={isWalletConnected} setIsWalletConnected={setIsWalletConnected} />
  } else if (activeTab === "settings") {
    return <SettingsContent />
  } else if (activeTab === "games") {
    return <GamesContent />
  } else if (activeTab === "leaderboard") {
    return <LeaderboardPage AAaddress={AAaddress} polls={polls} fetchPolls={fetchPolls} />
    //return <LeaderboardContent />
  } else {
    return <DashboardWithRoleSwitch polls={polls} AAaddress={AAaddress} />
  }
}

interface DashboardWithRoleSwitchProps {
  polls: any[];
  AAaddress: string;
}
function DashboardWithRoleSwitch({ polls, AAaddress }: DashboardWithRoleSwitchProps) {
  const [role, setRole] = useState<'creator' | 'responder'>('creator');
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dashboard for {role === 'creator' ? 'Creator' : 'Responder'}</h2>
      <div className="flex gap-2 mb-4 justify-center">
        <Button
          variant={role === 'creator' ? 'default' : 'outline'}
          onClick={() => setRole('creator')}
          className={`w-24 ${role === 'creator' ? '' : ''}`}
        >
          Creator
        </Button>
        <Button
          variant={role === 'responder' ? 'default' : 'outline'}
          onClick={() => setRole('responder')}
          className={`w-24 ${role === 'responder' ? '' : ''}`}
        >
          Responder
        </Button>
      </div>
      {role === 'creator' ? <PollCreatorDashboard polls={polls} /> : <PollResponderDashboard polls={polls} myAddress={AAaddress} />}
    </div>
  );
}

interface PollCreatorDashboardProps {
  polls: any[];
}
function PollCreatorDashboard({ polls }: PollCreatorDashboardProps) {
  // Compute summary
  const totalPolls = polls.length;
  const totalResponses = polls.reduce((sum, poll) => {
    return sum + (poll.totalResponses ? parseInt(poll.totalResponses, 10) : 0);
  }, 0);
  const activePolls = polls.filter(poll => poll.isOpen).length;
  // Safely sum BigNumbers for totalEarned
  let totalEarnedBN = polls.reduce((sum, poll) => {
    try {
      return sum.add(poll.funds ? ethers.BigNumber.from(poll.funds) : ethers.BigNumber.from(0));
    } catch {
      return sum;
    }
  }, ethers.BigNumber.from(0));
  const totalEarned = ethers.utils.formatEther(totalEarnedBN);
  // Responses Overview
  const responsesOverview = [
    { label: 'Open', value: polls.filter(p => p.status?.toLowerCase() === 'open').length },
    { label: 'Closed', value: polls.filter(p => p.status?.toLowerCase() === 'closed').length },
    { label: 'New', value: polls.filter(p => p.status?.toLowerCase() === 'new').length },
  ];
  // My Polls Table
  const myPolls = polls.map(poll => ({
    title: poll.subject,
    status: poll.status,
    responses: poll.totalResponses,
    reward: poll.rewardPerResponse ? `${ethers.utils.formatEther(poll.rewardPerResponse)} ETH` : '—',
  }));

  // Pie chart colors
  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  // Select time unit for chart display
  const [timeUnit, setTimeUnit] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Real data processing
  const responsesByDate: Record<string, number> = {};
  polls.forEach(poll => {
    if (poll.createdAt) {
      const date = new Date(poll.createdAt).toISOString().slice(0, 10); // YYYY-MM-DD
      responsesByDate[date] = (responsesByDate[date] || 0) + (poll.totalResponses ? parseInt(poll.totalResponses, 10) : 0);
    }
  });
  
  // Process data based on timeUnit
  let processedData: { date: string; responses: number; trend: number }[] = [];
  
  if (timeUnit === 'daily') {
    // Get last 7 days of data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().slice(0, 10);
    });
    
    processedData = last7Days.map(date => ({
      date,
      responses: responsesByDate[date] || 0,
      trend: 0 // Will be calculated below
    }));
  } else if (timeUnit === 'weekly') {
    // Get last 4 weeks of data
    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (21 - i * 7));
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `2024-W${Math.ceil((weekStart.getTime() - new Date(2024, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
    });
    
    // Group daily data into weeks
    const weeklyData: Record<string, number> = {};
    Object.entries(responsesByDate).forEach(([date, responses]) => {
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = `2024-W${Math.ceil((weekStart.getTime() - new Date(2024, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + responses;
    });
    
    processedData = last4Weeks.map(week => ({
      date: week,
      responses: weeklyData[week] || 0,
      trend: 0 // Will be calculated below
    }));
  } else if (timeUnit === 'monthly') {
    // Get last 6 months of data
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
    
    // Group daily data into months
    const monthlyData: Record<string, number> = {};
    Object.entries(responsesByDate).forEach(([date, responses]) => {
      const monthKey = date.slice(0, 7); // YYYY-MM
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + responses;
    });
    
    processedData = last6Months.map(month => ({
      date: month,
      responses: monthlyData[month] || 0,
      trend: 0 // Will be calculated below
    }));
  }
  
  // Calculate cumulative trend
  let cumulative = 0;
  const responsesWithTrend = processedData.map(item => {
    cumulative += item.responses;
    return { ...item, trend: cumulative };
  });

  // Use real data instead of dummy data
  let chartSource = responsesWithTrend;

  // Chart.js data for Responses Over Time
  const chartData: ChartData<'bar'> = {
    labels: chartSource.map(d => d.date),
    datasets: [
      {
        type: 'bar',
        label: 'Responses',
        data: chartSource.map(d => d.responses),
        backgroundColor: '#0088FE',
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line',
        label: 'Cumulative',
        data: chartSource.map(d => d.trend),
        borderColor: '#FFBB28',
        backgroundColor: '#FFBB28',
        yAxisID: 'y1',
        tension: 0.4,
        fill: false,
        order: 1,
      },
    ] as any, // allow mixed bar/line types
  };
  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        title: { display: true, text: 'Responses' },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Cumulative' },
      },
    },
  };

  return (
    <div className="grid gap-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPolls}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResponses.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePolls}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Funded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(totalEarned).toFixed(2)} ETH</div>
          </CardContent>
        </Card>
      </div>
      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Responses Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Pie chart using Recharts */}
            <div className="flex flex-row items-center justify-center h-80">
              <RePieChart width={400} height={320}>
                <Pie
                  data={responsesOverview}
                  dataKey="value"
                  nameKey="label"
                  cx={200}
                  cy={160}
                  outerRadius={100}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {responsesOverview.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Responses Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-2">
              <select
                value={timeUnit}
                onChange={e => setTimeUnit(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="daily">Daily (max 7 days)</option>
                <option value="weekly">Weekly (max 4 weeks)</option>
                <option value="monthly">Monthly (max 6 months)</option>
              </select>
            </div>
            {/* Chart.js bar + line chart */}
            <div className="flex items-center justify-center h-80">
              <Chart type='bar' data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* My Polls Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Polls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Poll Title</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Responses</th>
                  <th className="text-left py-2 px-2">Reward</th>
                </tr>
              </thead>
              <tbody>
                {myPolls.map((poll, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2 px-2">{poll.title}</td>
                    <td className="py-2 px-2">{poll.status}</td>
                    <td className="py-2 px-2">{poll.responses}</td>
                    <td className="py-2 px-2">{poll.reward}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PollResponderDashboard({ polls, myAddress }: { polls: any[], myAddress: string }) {
  const [selectedPoll, setSelectedPoll] = useState<any | null>(null);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);

  // Calculate summary data
  // 1. Total Polls Participated: polls where user has responded (responsesWithAddress.length > 0)
  const totalParticipated = polls.filter(poll => poll.responsesWithAddress && poll.responsesWithAddress.length > 0 && poll.responsesWithAddress.some((resp: any) => resp.address.toLowerCase() === myAddress.toLowerCase())).length;

  // 2. Total Rewards: sum of rewards from responsesWithAddress where isClaimed is true
  const totalRewardsBN = polls.reduce((sum, poll) => {
    if (poll.responsesWithAddress) {
      return sum.add(
        poll.responsesWithAddress.reduce((innerSum: any, resp: any) => {
          if (resp.isClaimed && resp.address.toLowerCase() === myAddress.toLowerCase()) {
            try {
              return innerSum.add(ethers.BigNumber.from(resp.reward));
            } catch {
              return innerSum;
            }
          }
          return innerSum;
        }, ethers.BigNumber.from(0))
      );
    }
    return sum;
  }, ethers.BigNumber.from(0));

  const totalRewards = ethers.utils.formatEther(totalRewardsBN);
  // 3. Active Polls Available: polls that are open
  const activePolls = polls.filter(poll => poll.isOpen).slice(0, 5);

  // Recent Polls Voted: polls where user has responded, sorted by latest response
  const recentPolls = polls
    .filter(poll => poll.responsesWithAddress && poll.responsesWithAddress.length > 0)
    .map(poll => {
      // Get the latest response
      const latestResponse = poll.responsesWithAddress.reduce((latest: any, resp: any) => {
        if (!latest || (resp.timestamp && resp.timestamp > latest.timestamp)) return resp;
        return latest;
      }, null);
      return {
        title: poll.subject,
        category: poll.category,
        date: latestResponse ? latestResponse.timestamp.toLocaleDateString() : '',
        reward: latestResponse ? (typeof latestResponse.reward === 'string' ? latestResponse.reward : latestResponse.reward + ' NERO') : '',
        status: poll.status,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="grid gap-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Polls Participated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRewards}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Polls Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePolls.length}</div>
          </CardContent>
        </Card>
      </div>
      {/* Recent Polls Voted Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Polls Voted</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Poll Title</th>
                  <th className="text-left py-2 px-2">Category</th>
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-left py-2 px-2">Reward</th>
                  <th className="text-left py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPolls.map((poll, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2 px-2">{poll.title}</td>
                    <td className="py-2 px-2">{poll.category}</td>
                    <td className="py-2 px-2">{poll.date}</td>
                    <td className="py-2 px-2">{poll.reward}</td>
                    <td className="py-2 px-2">{poll.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* Active Polls Available Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Polls Available</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Poll Title</th>
                  <th className="text-left py-2 px-2">Category</th>
                  <th className="text-left py-2 px-2">End Date</th>
                  <th className="text-left py-2 px-2">Reward</th>
                  <th className="text-left py-2 px-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {activePolls.map((poll, idx) => {
                  const isPollEnded = poll.status === 'closed' || (poll.endDate && calculateTimeLeft(poll.endDate) === 'Ended');
                  const hasVoted = poll.responsesWithAddress && poll.responsesWithAddress.some((resp: any) => resp.address.toLowerCase() === myAddress.toLowerCase());
                  const buttonLabel = (isPollEnded || hasVoted) ? 'View' : 'Vote';
                  const buttonVariant = (isPollEnded || hasVoted) ? 'outline' : 'default';
                  return (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2 px-2">{poll.subject}</td>
                      <td className="py-2 px-2">{poll.category}</td>
                      <td className="py-2 px-2">{poll.endDate ? poll.endDate.toLocaleDateString() : ''}</td>
                      <td className="py-2 px-2">{poll.rewardPerResponse ? `${ethers.utils.formatEther(poll.rewardPerResponse)} NERO` : ''}</td>
                      <td className="py-2 px-2">
                        <Button size="sm" variant={buttonVariant} onClick={() => { setSelectedPoll(poll); setIsPollModalOpen(true); }}>{buttonLabel}</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* VotePollModal for voting */}
            {selectedPoll && (
              <VotePollModal
                featureFlagNew={true}
                poll={selectedPoll}
                isOpen={isPollModalOpen}
                onClose={() => { setIsPollModalOpen(false); setSelectedPoll(null); }}
                fetchPolls={() => {}}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
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
