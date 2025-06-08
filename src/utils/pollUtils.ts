import { POLLS_DAPP_ABI } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import { PollState } from '@/types/poll';

export const handleClaimRewards = async (
  poll: PollState,
  isConnected: boolean,
  execute: any,
  waitForUserOpResult: any,
  fetchPolls: () => void,
  setUserOpHash: (hash: string | null) => void,
  setTxStatus: (status: string) => void,
  setIsPolling: (isPolling: boolean) => void,
  setIsLoading: (isLoading: boolean) => void,
  setIsModalOpen: (isOpen: boolean) => void
) => {
  if (!isConnected) {
    alert('Please connect your wallet first');
    return;
  }

  setIsLoading(true);
  setUserOpHash(null);
  setTxStatus('');

  try {
    await execute({
      function: 'claimReward',
      contractAddress: CONTRACT_ADDRESSES.dpollsContract,
      abi: POLLS_DAPP_ABI,
      params: [poll.id],
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
    setIsModalOpen(false);
  }
}; 