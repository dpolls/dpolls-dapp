import { ethers } from 'ethers';
import { POLLS_DAPP_ABI } from '@/constants/abi';

/**
 * Get EOA address from MetaMask or connected wallet
 * @returns Promise<string | null> - EOA address or null if not available
 */
export const getEOAAddress = async (): Promise<string | null> => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      return null;
    }

    // Request accounts from MetaMask
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (accounts && accounts.length > 0) {
      return accounts[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting EOA address:', error);
    return null;
  }
};

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
 * Check if either AA address or EOA address is the contract owner
 * @param contractAddress - The polls contract address
 * @param aaAddress - The AA (Smart Account) address
 * @param eoaAddress - The EOA (MetaMask) address, can be null
 * @param rpcUrl - The RPC URL for the network
 * @returns Promise<{isOwner: boolean, ownerType: 'aa' | 'eoa' | null}> - Ownership status and type
 */
export const isContractOwnerWithEOA = async (
  contractAddress: string,
  aaAddress: string,
  eoaAddress: string | null,
  rpcUrl: string
): Promise<{ isOwner: boolean; ownerType: 'aa' | 'eoa' | null; contractOwner: string | null }> => {
  try {
    if (!contractAddress || !rpcUrl) {
      return { isOwner: false, ownerType: null, contractOwner: null };
    }

    // Get contract owner address
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, POLLS_DAPP_ABI, provider);
    const ownerAddress = await contract.owner();

    // Check if AA address is owner
    if (aaAddress && ownerAddress.toLowerCase() === aaAddress.toLowerCase()) {
      return { isOwner: true, ownerType: 'aa', contractOwner: ownerAddress };
    }

    // Check if EOA address is owner (fallback)
    if (eoaAddress && ownerAddress.toLowerCase() === eoaAddress.toLowerCase()) {
      return { isOwner: true, ownerType: 'eoa', contractOwner: ownerAddress };
    }

    // Neither address is owner
    return { isOwner: false, ownerType: null, contractOwner: ownerAddress };
  } catch (error) {
    console.error('Error checking contract owner with EOA:', error);
    return { isOwner: false, ownerType: null, contractOwner: null };
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
