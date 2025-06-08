/**
 * Interface for wallet connection state
 */
export interface PollState {
  id: number;
  creator: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  createdAt: Date;
  viewType: string;
  options: string[];
  rewardPerResponse: string;
  maxResponses: string;
  duration: string;
  endDate: Date;
  isOpen: boolean;
  isFeatured?: boolean;
  totalResponses: number;
  funds: number;
  minContribution: string;
  fundingType: string;
  openImmediately: boolean;
  rewardDistribution: string;
  targetFund: string;
  responses: string[];
  numOptions: number;
  useAI: boolean;
  voteWeight: string;
  responsesWithAddress: {
    address: string;
    response: string;
    isClaimed: boolean;
    weight: number;
    timestamp: Date;
    reward: number;
  }[];
}