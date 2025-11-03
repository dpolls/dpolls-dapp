import { ethers } from 'ethers';
import { PollState } from '@/types/poll';

/**
 * Calculate the reward amount for a single response in a poll
 * @param poll - The poll state object
 * @param totalResponses - Total number of responses in the poll
 * @returns Reward amount in wei (BigNumber)
 */
export function calculateRewardPerResponse(poll: PollState, totalResponses: number): ethers.BigNumber {
  if (totalResponses === 0) {
    return ethers.BigNumber.from(0);
  }

  // For equal-share distribution, divide total funds equally
  if (poll.rewardDistribution === 'equal-share') {
    const totalFunds = ethers.BigNumber.from(poll.funds || '0');
    return totalFunds.div(totalResponses);
  }

  // For fixed distribution, use the fixed reward per response
  return ethers.BigNumber.from(poll.rewardPerResponse || '0');
}

/**
 * Format reward amount to human-readable NERO string
 * @param rewardWei - Reward amount in wei
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted string like "5.0000 NERO"
 */
export function formatReward(rewardWei: ethers.BigNumber, decimals: number = 4): string {
  const formatted = ethers.utils.formatEther(rewardWei);
  const num = parseFloat(formatted);
  return `${num.toFixed(decimals)} NERO`;
}

/**
 * Calculate total rewards for a specific address across all polls
 * @param polls - Array of poll states
 * @param address - Responder address to calculate for
 * @returns Total reward amount in wei (BigNumber)
 */
export function calculateTotalRewardsForAddress(polls: PollState[], address: string): ethers.BigNumber {
  let total = ethers.BigNumber.from(0);

  for (const poll of polls) {
    const responses = poll.responsesWithAddress || [];
    const totalResponses = responses.length;

    // Find all responses from this address (could be multiple in same poll)
    const addressResponses = responses.filter(
      r => r.address.toLowerCase() === address.toLowerCase() && !r.isClaimed
    );

    if (addressResponses.length > 0) {
      const rewardPerResponse = calculateRewardPerResponse(poll, totalResponses);
      // Add reward for each response (usually just 1 per poll, but handle edge cases)
      total = total.add(rewardPerResponse.mul(addressResponses.length));
    }
  }

  return total;
}

/**
 * Interface for a flattened response record
 */
export interface ResponseRecord {
  responderAddress: string;
  pollId: number;
  pollSubject: string;
  pollStatus: string;
  rewardAmount: ethers.BigNumber;
  rewardAmountFormatted: string;
  isClaimed: boolean;
  responseIndex: number;
}

/**
 * Flatten all polls into individual response records for distribution
 * @param polls - Array of poll states
 * @returns Array of response records with calculated rewards
 */
export function flattenPollResponses(polls: PollState[]): ResponseRecord[] {
  const records: ResponseRecord[] = [];

  for (const poll of polls) {
    const responses = poll.responsesWithAddress || [];
    const totalResponses = responses.length;
    const rewardPerResponse = calculateRewardPerResponse(poll, totalResponses);

    responses.forEach((response, index) => {
      records.push({
        responderAddress: response.address,
        pollId: poll.id,
        pollSubject: poll.subject,
        pollStatus: poll.status,
        rewardAmount: rewardPerResponse,
        rewardAmountFormatted: formatReward(rewardPerResponse),
        isClaimed: response.isClaimed,
        responseIndex: index,
      });
    });
  }

  return records;
}
