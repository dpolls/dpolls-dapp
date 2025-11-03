import { ethers } from 'ethers';
import { POLLS_DAPP_ABI, POLLS_DAPP_LEGACY_ABI } from '../constants/abi';

export interface PollResponse {
  responder: string;
  chosenOptions: number[];
  contribution: ethers.BigNumber;
  timestamp: ethers.BigNumber;
  isClaimed: boolean;
}

export interface PollState {
  creator: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  viewType: string;
  options: string[];
  rewardPerResponse: string;
  maxResponses: string;
  durationDays: string;
  minContribution: string;
  fundingType: string;
  targetFund: string;
  endTime: string;
  isOpen: boolean;
  totalResponses: string;
  funds: string;
  rewardToken: string;
  rewardDistribution: string;
  projectId: string;
  responsesWithAddress?: Array<{
    address: string;
    chosenOptions: number[];
    contribution: ethers.BigNumber;
    timestamp: ethers.BigNumber;
    isClaimed: boolean;
  }>;
}

/**
 * Fetches poll details with automatic fallback from current ABI to legacy ABI
 * @param pollId - The poll ID to fetch
 * @param contractAddress - The contract address
 * @param provider - The ethers provider
 * @returns Poll state object or null if fetch fails
 */
export async function fetchPollWithFallback(
  pollId: number,
  contractAddress: string,
  provider: ethers.providers.Provider
): Promise<PollState | null> {
  try {
    // First attempt: Try with current ABI (includes projectId)
    const pollsContract = new ethers.Contract(
      contractAddress,
      POLLS_DAPP_ABI,
      provider
    );

    const [pollData, responsesData] = await Promise.all([
      pollsContract.getPoll(pollId),
      pollsContract.getPollResponses(pollId),
    ]);

    // Parse responses
    const responsesWithAddress = responsesData.map((response: PollResponse) => ({
      address: response.responder,
      chosenOptions: response.chosenOptions,
      contribution: response.contribution,
      timestamp: response.timestamp,
      isClaimed: response.isClaimed,
    }));

    return {
      creator: pollData.creator,
      subject: pollData.subject,
      description: pollData.description,
      category: pollData.category,
      status: pollData.status,
      viewType: pollData.viewType,
      options: pollData.options,
      rewardPerResponse: pollData.rewardPerResponse.toString(),
      maxResponses: pollData.maxResponses.toString(),
      durationDays: pollData.durationDays.toString(),
      minContribution: pollData.minContribution.toString(),
      fundingType: pollData.fundingType,
      targetFund: pollData.targetFund.toString(),
      endTime: pollData.endTime.toString(),
      isOpen: pollData.isOpen,
      totalResponses: pollData.totalResponses.toString(),
      funds: pollData.funds.toString(),
      rewardToken: pollData.rewardToken,
      rewardDistribution: pollData.rewardDistribution,
      projectId: pollData.projectId,
      responsesWithAddress,
    };
  } catch (error) {
    // Fallback: Try with legacy ABI (no projectId)
    try {
      console.log(`Retrying poll ${pollId} with legacy ABI...`);

      const pollsContractLegacy = new ethers.Contract(
        contractAddress,
        POLLS_DAPP_LEGACY_ABI,
        provider
      );

      const [pollData, responsesData] = await Promise.all([
        pollsContractLegacy.getPoll(pollId),
        pollsContractLegacy.getPollResponses(pollId),
      ]);

      // Parse responses
      const responsesWithAddress = responsesData.map((response: PollResponse) => ({
        address: response.responder,
        chosenOptions: response.chosenOptions,
        contribution: response.contribution,
        timestamp: response.timestamp,
        isClaimed: response.isClaimed,
      }));

      return {
        creator: pollData.creator,
        subject: pollData.subject,
        description: pollData.description,
        category: pollData.category,
        status: pollData.status,
        viewType: pollData.viewType,
        options: pollData.options,
        rewardPerResponse: pollData.rewardPerResponse.toString(),
        maxResponses: pollData.maxResponses.toString(),
        durationDays: pollData.durationDays.toString(),
        minContribution: pollData.minContribution.toString(),
        fundingType: pollData.fundingType,
        targetFund: pollData.targetFund.toString(),
        endTime: pollData.endTime.toString(),
        isOpen: pollData.isOpen,
        totalResponses: pollData.totalResponses.toString(),
        funds: pollData.funds.toString(),
        rewardToken: pollData.rewardToken,
        rewardDistribution: pollData.rewardDistribution,
        projectId: '0', // Legacy polls don't have projectId
        responsesWithAddress,
      };
    } catch (legacyError) {
      console.error(`Failed to fetch poll ${pollId} with both ABIs:`, legacyError);
      return null;
    }
  }
}
