import { ethers } from 'ethers';
import { POLLS_DAPP_ABI } from '@/constants/abi';

/**
 * Check if the given address is the contract owner
 * @param contractAddress - The polls contract address
 * @param userAddress - The user's wallet address to check
 * @param rpcUrl - The RPC URL for the network
 * @returns Promise<boolean> - True if user is owner, false otherwise
 */
export const isContractOwner = async (
  contractAddress: string,
  userAddress: string,
  rpcUrl: string
): Promise<boolean> => {
  try {
    if (!contractAddress || !userAddress || !rpcUrl) {
      return false;
    }

    // Create provider
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    // Create contract instance
    const contract = new ethers.Contract(
      contractAddress,
      POLLS_DAPP_ABI,
      provider
    );

    // Get owner address from contract
    const ownerAddress = await contract.owner();

    // Compare addresses (case-insensitive)
    return ownerAddress.toLowerCase() === userAddress.toLowerCase();
  } catch (error) {
    console.error('Error checking contract owner:', error);
    return false;
  }
};

/**
 * Get the contract owner address
 * @param contractAddress - The polls contract address
 * @param rpcUrl - The RPC URL for the network
 * @returns Promise<string | null> - Owner address or null if error
 */
export const getContractOwner = async (
  contractAddress: string,
  rpcUrl: string
): Promise<string | null> => {
  try {
    if (!contractAddress || !rpcUrl) {
      return null;
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      contractAddress,
      POLLS_DAPP_ABI,
      provider
    );

    const ownerAddress = await contract.owner();
    return ownerAddress;
  } catch (error) {
    console.error('Error getting contract owner:', error);
    return null;
  }
};

/**
 * Check if contract is paused
 * @param contractAddress - The polls contract address
 * @param rpcUrl - The RPC URL for the network
 * @returns Promise<boolean> - True if paused, false otherwise
 */
export const isContractPaused = async (
  contractAddress: string,
  rpcUrl: string
): Promise<boolean> => {
  try {
    if (!contractAddress || !rpcUrl) {
      return false;
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      contractAddress,
      POLLS_DAPP_ABI,
      provider
    );

    const paused = await contract.paused();
    return paused;
  } catch (error) {
    console.error('Error checking pause status:', error);
    return false;
  }
};

/**
 * Format admin action results for display
 */
export const formatAdminActionResult = (
  result: any,
  actionName: string
): { title: string; description: string; variant?: 'default' | 'destructive' } => {
  if (result.result === true) {
    return {
      title: 'Success',
      description: `${actionName} completed successfully!`,
      variant: 'default'
    };
  } else if (result.transactionHash) {
    return {
      title: 'Transaction Submitted',
      description: `${actionName} transaction: ${result.transactionHash}`,
      variant: 'default'
    };
  } else {
    return {
      title: 'Error',
      description: `${actionName} failed. Please try again.`,
      variant: 'destructive'
    };
  }
};
