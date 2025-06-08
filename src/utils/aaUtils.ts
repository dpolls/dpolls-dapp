// src/utils/aaUtils.ts
import { ethers } from 'ethers';
import { Client, Presets } from 'userop';
import neroConfig from '../../nerowallet.config'
import { CONTRACT_ADDRESSES } from '@/constants/contracts'
import { POLLS_DAPP_ABI } from '@/constants/abi';

// Get Ethereum provider
export const getProvider = () => {
  return new ethers.providers.JsonRpcProvider(neroConfig.chains[0].chain.rpc);
};
 
// Get signer from browser wallet
export const getSigner = async () => {
  if (!window.ethereum) {
    throw new Error("No crypto wallet found. Please install Metamask.");
  }
  
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return provider.getSigner();
};
 
// Initialize AA Client
export const initAAClient = async (accountSigner: ethers.Signer) => {
  return await Client.init(neroConfig.chains[0].chain.rpc, {
    overrideBundlerRpc: neroConfig.chains[0].aa.bundler,
    entryPoint: neroConfig.chains[0].aaContracts.entryPoint,
  });
};
 
// Get AA wallet address for a signer
export const getAAWalletAddress = async (accountSigner: ethers.Signer, apiKey?: string) => {
  try {
    // Initialize the SimpleAccount builder
    const simpleAccount = await Presets.Builder.SimpleAccount.init(
      accountSigner,
      neroConfig.chains[0].chain.rpc,
      {
        overrideBundlerRpc: neroConfig.chains[0].aa.bundler,
        entryPoint: neroConfig.chains[0].aaContracts.entryPoint,
        factory: neroConfig.chains[0].aaContracts.accountFactory,
      }
    );
    
    // Get the counterfactual address of the AA wallet
    const address = await simpleAccount.getSender();
    console.log("AA wallet address:", address);
    
    return address;
  } catch (error) {
    console.error("Error getting AA wallet address:", error);
    throw error;
  }
};

// Function to execute a contract call via AA with sponsored gas
export const executeSponsoredOperation = async (
    accountSigner: ethers.Signer,
    contractAddress: string,
    contractAbi: any,
    functionName: string,
    functionParams: any[],
    value: any,
    options?: {
      apiKey?: string;
      gasMultiplier?: number;
    }
  ) => {
    try {
      // Initialize AA client
      const client = await Client.init(neroConfig.chains[0].chain.rpc, {
        overrideBundlerRpc: neroConfig.chains[0].aa.bundler,
        entryPoint: neroConfig.chains[0].aaContracts.entryPoint
      });
      
      // Initialize AA builder
      const builder = await Presets.Builder.SimpleAccount.init(
        accountSigner,
        neroConfig.chains[0].chain.rpc,
        {
          overrideBundlerRpc: neroConfig.chains[0].aa.bundler,
           entryPoint: neroConfig.chains[0].aaContracts.entryPoint,
          factory: neroConfig.chains[0].aaContracts.accountFactory,
        }
      );
      
      // Configure gas parameters
    //   const gasParams = {
    //     callGasLimit: "0x88b8",
    //     verificationGasLimit: "0x33450",
    //     preVerificationGas: "0xc350",
    //     maxFeePerGas: "0x2162553062",
    //     maxPriorityFeePerGas: "0x40dbcf36",
    //   };
      
    //   // Set gas parameters
    //   builder.setCallGasLimit(gasParams.callGasLimit);
    //   builder.setVerificationGasLimit(gasParams.verificationGasLimit);
    //   builder.setPreVerificationGas(gasParams.preVerificationGas);
    //   builder.setMaxFeePerGas(gasParams.maxFeePerGas);
    //   builder.setMaxPriorityFeePerGas(gasParams.maxPriorityFeePerGas);
      
      // Configure paymaster for sponsored transactions (free)
      const paymasterOptions = {
        apikey: options?.apiKey || neroConfig.chains[0].aa.paymasterAPIKey,
        rpc: neroConfig.chains[0].aa.paymaster,
        type: "0" // Type 0 = sponsored/free gas
      };
      
      // Set paymaster options
      builder.setPaymasterOptions(paymasterOptions);
      
      // Create contract instance
      const contract = new ethers.Contract(
        contractAddress,
        contractAbi,
        ethers.getDefaultProvider()
      );
      
      // Encode function call
      const callData = contract.interface.encodeFunctionData(
        functionName,
        functionParams
      );
      
      // Create the UserOperation
      const userOp = await builder.execute(contractAddress, value, callData);
      
      console.log("Sending UserOperation to paymaster...");
      
      // Send the UserOperation
      const res = await client.sendUserOperation(userOp);
      console.log("UserOperation sent with hash:", res.userOpHash);
      
      // Wait for the transaction to be included
      const receipt = await res.wait();
      if (!receipt) {
          throw new Error("Transaction receipt is null");
      }
      console.log("Transaction mined in block:", receipt.blockNumber);
   
      return {
          userOpHash: res.userOpHash,
          transactionHash: receipt.transactionHash,
          receipt: receipt
      };
    } catch (error) {
      console.error("Error executing operation:", error);
      throw error;
    }
  };

  export const fundPoll = async (
    accountSigner: ethers.Signer,
    pollId: string,
    amount: any,
    options?: {
      apiKey?: string;
      gasMultiplier?: number;
    }
  ) => {
    try {
      // Execute the mint function with sponsored gas
      return await executeSponsoredOperation(
        accountSigner,
        CONTRACT_ADDRESSES.dpollsContract,
        POLLS_DAPP_ABI,
        'fundPoll',
        [pollId],
        amount,
        options
      );
    } catch (error) {
      console.error("Error funding poll:", error);
      throw error;
    }
  };