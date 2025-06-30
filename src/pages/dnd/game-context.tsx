"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { POLLS_DAPP_ABI, } from '@/constants/abi';
import { useSignature, useSendUserOp, useConfig } from '@/hooks';
import { ethers } from 'ethers';
import { ConfigContext } from '@/contexts';
import { useToast } from '@/components/ui_v3/use-toast';

// Define types
type Position = {
  x: number
  y: number
}

type Poll = {
  id: any
  key: number
  position: Position
  subject: string
  options: string[]
  votes: number[]
  responses: any[]
  responsesWithAddress: any[]
  creator: string
  description: string
  rewardPerResponse: any
  duration: number
  maxResponses: number
  minContribution: any
  targetFund: any
}


const NERO_POLL_ABI = [
  // Basic ERC721 functions from the standard ABI
  ...POLLS_DAPP_ABI,
  // Add the mint function that exists in the NeroNFT contract
  'function mint(address to, string memory uri) returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string memory)',
];

export type CharacterType = "link" | "mario" | "luigi" | "toad" | "peach"

type GameContextType = {
  characterPosition: Position
  setCharacterPosition: React.Dispatch<React.SetStateAction<Position>>
  targetPosition: Position | null
  setTargetPosition: React.Dispatch<React.SetStateAction<Position | null>>
  polls: Poll[]
  activePoll: Poll | null
  setActivePoll: React.Dispatch<React.SetStateAction<Poll | null>>
  votePoll: (pollId: number, option: string) => void
  selectedCharacter: CharacterType
  setSelectedCharacter: React.Dispatch<React.SetStateAction<CharacterType>>
  isCharacterSelectOpen: boolean
  setCharacterSelectOpen: React.Dispatch<React.SetStateAction<boolean>>
  visitedPolls: Set<number>
  addToVisitedPolls: (pollId: number) => void
  handlePollClick: (poll: Poll) => void
}

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined)

function generateRandomPosition(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function GameProvider({ children, AAaddress, handleTabChange }: 
  { children: React.ReactNode, AAaddress: string, handleTabChange: (tab: string) => void, pollsSrc: any[] }) {
  const config = useContext(ConfigContext);
  const { toast } = useToast();
  const [characterPosition, setCharacterPosition] = useState<Position>({ x: 50, y: 50 })
  const [targetPosition, setTargetPosition] = useState<Position | null>(null)

  const { isConnected, } = useSignature();
  const { execute, waitForUserOpResult, sendUserOp } = useSendUserOp();
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [polls, setPolls] = useState<Poll[]>([])
  const [activePoll, setActivePoll] = useState<Poll | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType>("link")
  const [isCharacterSelectOpen, setCharacterSelectOpen] = useState<boolean>(false)
  const [visitedPolls, setVisitedPolls] = useState<Set<number>>(new Set())

  // Add a poll ID to the visited polls set
  const addToVisitedPolls = (pollId: number) => {
    setVisitedPolls((prev) => new Set(prev).add(pollId))
  }

  // Handle poll marker click
  const handlePollClick = (clickedPoll: Poll) => {
    // Find the poll
    const poll = polls.find((p) => p.key === clickedPoll.key)
    if (!poll) return

    // Check if character is close enough to interact
    const distance = Math.sqrt(
      Math.pow(characterPosition.x - poll.position.x, 2) + Math.pow(characterPosition.y - poll.position.y, 2),
    )

    // Only open if character is close enough (within 15% of map width)
    if (distance < 15) {
      setActivePoll(poll)
      console.log("active poll", poll)
    }
  }

  // Check for poll collisions - only for first-time visits
  useEffect(() => {
    if (activePoll) return // Don't check if a poll is already active

    const collisionDistance = 5
    polls.forEach((poll) => {
      // Skip if this poll has been visited before
      if (visitedPolls.has(poll.key)) return

      const distance = Math.sqrt(
        Math.pow(characterPosition.x - poll.position.x, 2) + Math.pow(characterPosition.y - poll.position.y, 2),
      )

      if (distance < collisionDistance) {
        setActivePoll(poll)
        addToVisitedPolls(poll.key) // Mark as visited
      }
    })
  }, [characterPosition, polls, activePoll, visitedPolls])

  // Move character towards target without animation
  useEffect(() => {
    if (!targetPosition) return

    // Simply set the character position to the target
    setCharacterPosition({ ...targetPosition })
    setTargetPosition(null)
  }, [targetPosition, setCharacterPosition])

  // Fetch polls
  useEffect(() => {
    fetchPolls()
  }, [])


  // Vote on a poll
  const handleOptionVoteLocal = async (poll: Poll, option: string) => {
    console.log("poll", poll)
    console.log("option", option)
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
          option,
        ],
        value: 0,
      });

      const result = await waitForUserOpResult();
      setUserOpHash(result.userOpHash);
      setIsPolling(true);

      if (result.result === true) {
        setIsPolling(false);
      } else if (result.transactionHash) {
        setTxStatus('Transaction hash: ' + result.transactionHash);
      }
    } catch (error) {
      console.error('Error:', error);
      setTxStatus('An error occurred');
    } finally {
      setIsVoting(false);
      setIsModalOpen(false);
      setActivePoll(null)
      fetchPolls();
    }

  };

  // Vote on a poll
  const votePoll = (pollKey: number, option: string) => {
    console.log("voting for poll", pollKey)
    const toVotePoll = polls.find((p) => p.key === pollKey)
    console.log("toVotePoll", toVotePoll)
    if (!toVotePoll) return
    handleOptionVoteLocal(toVotePoll, option)
  }

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
        const fetchedPolls = await Promise.all(
          allPollIds.map(async (pollId: number) => {
            try {
              // Get poll details using the polls function
              const pollDetails = await pollsContract.getPoll(pollId);
              const pollResponses = await pollsContract.getPollResponses(pollId);
              const modPollResponses = pollResponses.map((response: any) => {
                return response.response
              });
              const pollResonsesWithAddress = pollResponses.map((response: any) => {
                return {
                  address: response.responder,
                  response: response.response,
                  isClaimed: response.isClaimed,
                }
              });
              
              // Format the poll data
              return {
                id: pollId,
                creator: pollDetails.creator,
                subject: pollDetails.subject,
                description: pollDetails.description,
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
            } catch (error) {
              console.error(`Error fetching Poll #${pollId}:`, error);
              return null;
            }
          })
        );

        // Filter out any null values from failed fetches
        const validOpenPolls = fetchedPolls.filter(poll => poll !== null && poll.isOpen);
        
        if (validOpenPolls.length > 0) {
          const notVotedPolls = validOpenPolls.filter((poll) => !poll.responsesWithAddress.some((response: any) => response.address === AAaddress))
          console.log("notVotedPolls", notVotedPolls)
          const convertedPolls: Poll[] = notVotedPolls.map((poll, index) => ({
            key: index,
            id: poll.id,
            position: { x: generateRandomPosition(30, 100), y: generateRandomPosition(30, 100) },
            question: poll.question,
            subject: poll.subject,
            options: poll.options,
            votes: poll.responses,
            responses: poll.responses,
            responsesWithAddress: poll.responsesWithAddress,
            creator: poll.creator,
            description: poll.description,
            rewardPerResponse: poll.rewardPerResponse,
            duration: poll.duration,
            maxResponses: poll.maxResponses,
            minContribution: poll.minContribution,
            targetFund: poll.targetFund,
          }))

          setPolls(convertedPolls);
          setTxStatus(`Found ${convertedPolls.length} Polls`);
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
    <GameContext.Provider
      value={{
        characterPosition,
        setCharacterPosition,
        targetPosition,
        setTargetPosition,
        polls,
        activePoll,
        setActivePoll,
        votePoll,
        selectedCharacter,
        setSelectedCharacter,
        isCharacterSelectOpen,
        setCharacterSelectOpen,
        visitedPolls,
        addToVisitedPolls,
        handlePollClick,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

// Custom hook to use the game context
export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}
