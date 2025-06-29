import { ethers } from 'ethers';
import { POLLS_DAPP_ABI } from '@/constants/abi';
import { PollState } from '@/types/poll';

interface CreatePollParams {
  pollForm: PollState;
  AAaddress: string;
  isConnected: boolean;
  execute: (params: any) => Promise<any>;
  waitForUserOpResult: () => Promise<any>;
  contractAddress: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  onUserOpHashChange?: (hash: string | null) => void;
  onTxStatusChange?: (status: string) => void;
  onPollingChange?: (isPolling: boolean) => void;
}

export const handleCreatePoll = async ({
  pollForm,
  AAaddress,
  isConnected,
  execute,
  waitForUserOpResult,
  contractAddress,
  onSuccess,
  onError,
  onLoadingChange,
  onUserOpHashChange,
  onTxStatusChange,
  onPollingChange,
}: CreatePollParams) => {
  if (!isConnected) {
    alert('Please connect your wallet first');
    return;
  }

  onLoadingChange?.(true);
  onUserOpHashChange?.(null);
  onTxStatusChange?.('');

  try {
    if (pollForm.fundingType === 'unfunded') {
      const pollInput = {
        creator: AAaddress,
        subject: pollForm.subject,
        description: pollForm.description,
        category: pollForm.category,
        viewType: pollForm.viewType,
        options: pollForm.options,
        durationDays: parseInt(pollForm.duration || "90"),
        isOpenImmediately: pollForm.openImmediately
      };

      await execute({
        function: 'createUnfundedPoll',
        contractAddress: contractAddress,
        abi: POLLS_DAPP_ABI,
        params: [pollInput],
        value: 0
      });
    } else {
      let value = null;
      if (pollForm.fundingType === "self-funded") {
        value = pollForm.targetFund;
      } else {
        value = "0";
      }

      let targetFund = null;
      let rewardPerResponse = "";
      if (pollForm.rewardDistribution === "equal-share") {
        rewardPerResponse = "0";
        targetFund = pollForm.targetFund || "0";
      } else {
        rewardPerResponse = pollForm.rewardPerResponse;
        const rewardPerResponseNum = parseFloat(rewardPerResponse);
        const maxResponsesNum = parseInt(pollForm.maxResponses || "0");
        targetFund = (rewardPerResponseNum * maxResponsesNum).toString();
      }

      const pollInput = {
        creator: AAaddress,
        subject: pollForm.subject,
        description: pollForm.description,
        category: pollForm.category,
        viewType: pollForm.viewType,
        options: pollForm.options,
        rewardPerResponse: ethers.utils.parseEther(rewardPerResponse).toString(),
        durationDays: parseInt(pollForm.duration || "90"),
        maxResponses: parseInt(pollForm.maxResponses || "1000"),
        minContribution: ethers.utils.parseEther(pollForm.minContribution || "0.000001").toString(),
        fundingType: pollForm.fundingType,
        isOpenImmediately: pollForm.openImmediately,
        targetFund: ethers.utils.parseEther(targetFund).toString(),
        rewardToken: ethers.constants.AddressZero,
        rewardDistribution: pollForm.rewardDistribution,
        voteWeight: "simple", // Default to simple voting
        baseContributionAmount: ethers.utils.parseEther("1").toString(), // Default to 1 ETH as base
        maxWeight: "10" // Default max weight of 10
      };

      console.log('pollInput before submission ', pollInput)
      await execute({
        function: 'createPoll',
        contractAddress: contractAddress,
        abi: POLLS_DAPP_ABI,
        params: [pollInput],
        value: ethers.utils.parseEther(value).toString()
      });
    }

    const result = await waitForUserOpResult();
    console.log('result', result);
    onUserOpHashChange?.(result.userOpHash);
    onPollingChange?.(true);

    if (result.result === true) {
      onSuccess?.();
      onPollingChange?.(false);
    } else if (result.transactionHash) {
      onTxStatusChange?.('Transaction hash: ' + result.transactionHash);
    }
  } catch (error) {
    console.error('Error:', error);
    onTxStatusChange?.('An error occurred');
    onError?.(error);
  } finally {
    onLoadingChange?.(false);
  }
}; 