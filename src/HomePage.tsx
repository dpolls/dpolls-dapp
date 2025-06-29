"use client"

import { useState, useContext, useEffect } from 'react';
import { useSignature, useSendUserOp, useConfig, } from '@/hooks';
import { POLLS_DAPP_ABI,  } from '@/constants/abi';
import { ethers } from 'ethers';
import Dashboard from "@/pages/simple/dashboard"
import CreatePoll from "@/pages/simple/create-poll"
import EnvelopeGame from "@/pages/envelopes/envelope-game"
import DungeonsAndDragons from "@/pages/dnd/page"
import LeaderboardPage from '@/pages/leaderboard/page';
import { PollState } from '@/types/poll';
import { convertTimestampToDate } from '@/utils/format';
import { ConfigContext } from '@/contexts';
import { useToast } from '@/components/ui_v3/use-toast';

// Define NeroNFT ABI with the mint function
const NERO_POLL_ABI = [
  // Basic ERC721 functions from the standard ABI
  ...POLLS_DAPP_ABI,
  // Add the mint function that exists in the NeroNFT contract
  'function mint(address to, string memory uri) returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string memory)',
];

const HomePage = () => {
  const config = useContext(ConfigContext);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeDashboardTab, setActiveDashboardTab] = useState('active');
  const { AAaddress, isConnected, simpleAccountInstance } = useSignature();
  const [isVoting, setIsVoting] = useState(false);

  const { execute, waitForUserOpResult, sendUserOp } = useSendUserOp();
  const [isLoading, setIsLoading] = useState(false);
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);
  const [polls, setPolls] = useState<PollState[]>([]);
  
  useEffect(() => {
    if (isConnected) {
      fetchPolls();
    }
  }, [isConnected]); // Only re-run if isConnected changes

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Reset form values
    setTxStatus('');
    setUserOpHash(null);
    
    // If switching to NFT gallery, fetch the NFTs
    if ((tab === 'dashboard' || tab === 'nft-gallery') && isConnected) {
      fetchPolls();
    }
  };

  const handleCreatePoll = async (pollForm: any) => {
    if (!isConnected) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!config?.chains[config?.currentNetworkIndex]?.dpolls?.contractAddress) {
      toast({
        title: "Error",
        description: "Contract address not configured",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: 'createPoll',
        contractAddress: config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        abi: NERO_POLL_ABI, // Use the specific ABI with mint function
        params: [
          pollForm.subject,
          pollForm.description,
          pollForm.options,
          ethers.utils.parseEther(pollForm.rewardPerResponse).toString(),
          parseInt(pollForm.duration),
          parseInt(pollForm.maxResponses),
          ethers.utils.parseEther(pollForm.minContribution).toString(),
          ethers.utils.parseEther(pollForm.targetFund).toString(),
        ],
        value: 0,
      });

      const result = await waitForUserOpResult();
      setUserOpHash(result.userOpHash);
      setIsPolling(true);

      if (result.result === true) {
        setIsPolling(false);
        fetchPolls();
      } else if (result.transactionHash) {
        setTxStatus('Transaction hash: ' + result.transactionHash);
      }
    } catch (error) {
      console.error('Error:', error);
      setTxStatus('An error occurred');
    } finally {
      setIsLoading(false);
      setActiveDashboardTab("created");
    }
  };

  const handleOptionVote = async (poll: any, option: any) => {
    if (!isConnected) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!config?.chains[config?.currentNetworkIndex]?.dpolls?.contractAddress) {
      toast({
        title: "Error",
        description: "Contract address not configured",
        variant: "destructive",
      });
      return;
    }

    setIsVoting(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: 'submitResponse',
        contractAddress: config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        abi: NERO_POLL_ABI, // Use the specific ABI with mint function
        params: [
          poll.id,
          option.text,
        ],
        value: 0,
      });

      const result = await waitForUserOpResult();
      setUserOpHash(result.userOpHash);
      setIsPolling(true);

      if (result.result === true) {
        setIsPolling(false);
        fetchPolls();
      } else if (result.transactionHash) {
        setTxStatus('Transaction hash: ' + result.transactionHash);
      }
    } catch (error) {
      console.error('Error:', error);
      setTxStatus('An error occurred');
    } finally {
      setIsVoting(false);
    }

  };

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
              return {
                id: pollId,
                creator: pollDetails.creator,
                subject: pollDetails.subject,
                description: pollDetails.description,
                status: pollDetails.status,
                createdAt: new Date(Number(pollDetails.endTime) * 1000 - Number(pollDetails.durationDays) * 24 * 60 * 60 * 1000),
                options: pollDetails.options,
                rewardPerResponse: pollDetails.rewardPerResponse,
                maxResponses: pollDetails.maxResponses.toString(),
                endDate: new Date(Number(pollDetails.endTime) * 1000),
                isOpen: pollDetails.isOpen,
                totalResponses: pollDetails.totalResponses.toString(),
                funds: pollDetails.funds,
                minContribution: pollDetails.minContribution,
                targetFund: pollDetails.targetFund,
                responses: modPollResponses,
                responsesWithAddress: pollResonsesWithAddress
              };
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">NERO Decentralized Polls</h1>
      <p className="mb-4 text-m text-gray-600">
        Where your opinion matters
      </p>
      
      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => handleTabChange('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'leaderboard' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => handleTabChange('leaderboard')}
        >
          Leaderboard
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'envelope-game' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => handleTabChange('envelope-game')}
        >
          Envelopes
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'dnd-game' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => handleTabChange('dnd-game')}
        >
          D&D
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'create-poll' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => handleTabChange('create-poll')}
        >
          Create Poll
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <Dashboard
          AAaddress={AAaddress}
          handleTabChange={handleTabChange}
          polls={polls}
          fetchPolls={fetchPolls}
          activeDashboardTab={activeDashboardTab}
        />
      )}
      {activeTab === 'leaderboard' && (
        <LeaderboardPage
          AAaddress={AAaddress}
          polls={polls}
          fetchPolls={fetchPolls}
        />
      )}
      {activeTab === 'envelope-game' && (
        <EnvelopeGame
          AAaddress={AAaddress}
          handleTabChange={handleTabChange}
          pollsSrc={polls}
          fetchPolls={fetchPolls}
          handleOptionVote={handleOptionVote}
        />
      )}
      {activeTab === 'dnd-game' && (
        <DungeonsAndDragons 
          AAaddress={AAaddress}
          handleTabChange={handleTabChange}
          pollsSrc={polls}
          fetchPolls={fetchPolls}
          handleOptionVote={handleOptionVote}
        />
      )}
      {activeTab === 'create-poll' && (
        <CreatePoll />
      )}
    </div>
  );
};

export default HomePage; 