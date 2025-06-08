"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { useSignature, useSendUserOp } from '@/hooks';
import { POLLS_DAPP_ABI, } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts'
import { Button } from 'antd';

interface PollLetterProps {
  poll: {
    subject: string
    options: string[]
  }
  onClose: () => void
  fetchPolls: () => void
}

const NERO_POLL_ABI = [
  // Basic ERC721 functions from the standard ABI
  ...POLLS_DAPP_ABI,
  // Add the mint function that exists in the NeroNFT contract
  'function mint(address to, string memory uri) returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string memory)',
];

export default function PollLetter({ poll, onClose, fetchPolls }: PollLetterProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { isConnected, } = useSignature();
  const { execute, waitForUserOpResult, sendUserOp } = useSendUserOp();
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManagePollModalOpen, setIsManagePollModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option)
  }

  const handleOptionVote = async (poll, option) => {
    console.log("poll", poll)
    console.log("option", option)
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsVoting(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: 'submitResponse',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
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
      onClose();
      fetchPolls();
    }

  };

  const handleSubmit = () => {
    if (selectedOption) {
      setIsSubmitted(true)
      handleOptionVote(poll, selectedOption)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        delayChildren: 0.3,
        staggerChildren: 0.1,
      },
    },
  }

  const letterVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
  }

  return (
    <div className="relative">
      {/* Envelope */}
      <motion.div
        className="relative w-80 h-64 bg-amber-100 rounded-md shadow-lg border-2 border-amber-300"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.05, 0.95, 1], rotateZ: [0, -2, 2, 0] }}
        transition={{ duration: 0.5 }}
      >
        {/* Envelope flap opening animation */}
        <motion.div
          className="absolute top-0 left-0 w-full h-1/2 origin-bottom bg-amber-200 rounded-t-md border border-amber-300 z-10"
          style={{ clipPath: "polygon(0 100%, 50% 0%, 100% 100%)" }}
          initial={{ rotateX: 0, zIndex: 10 }}
          animate={{ rotateX: 180, zIndex: 1 }}
          transition={{
            rotateX: { duration: 0.7, delay: 0.3 },
            zIndex: { delay: 0.7 },
          }}
        />

        {/* Letter coming out animation */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-72 origin-top"
          initial={{ y: 0, height: 0, translateX: "-50%", zIndex: 5 }}
          animate={{
            y: -200,
            height: "auto",
            translateX: "-50%",
            zIndex: 20,
          }}
          transition={{
            y: { type: "spring", stiffness: 70, damping: 15, delay: 0.8 },
            height: { type: "spring", stiffness: 70, damping: 15, delay: 0.8 },
            zIndex: { delay: 0.9 },
          }}
        >
          {/* Letter paper */}
          <div className="relative w-full h-full bg-white rounded-md shadow-md border border-gray-200 overflow-hidden">
            {/* Poll content - only visible after animation completes */}
            <motion.div
              className="p-4 pt-8 h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }} // Only show content after letter is out
            >
              <motion.button className="absolute top-1 right-2 p-1 rounded-full hover:bg-gray-100" onClick={onClose}>
                <X size={18} />
              </motion.button>

              <motion.h4
                className="text-xl font-bold text-center mb-4 text-gray-800"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 2.0 }}
              >
                {poll.subject}
              </motion.h4>

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2 }}
              >
                {poll.options.map((option, index) => (
                  <motion.div
                    key={index}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedOption === option ? "bg-sky-100 border-sky-400" : "hover:bg-gray-50 border-gray-200"
                      }`}
                    onClick={() => handleOptionSelect(option)}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 2.2 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${selectedOption === option ? "border-sky-500" : "border-gray-400"
                          }`}
                      >
                        {selectedOption === option && <div className="w-2 h-2 rounded-full bg-sky-500" />}
                      </div>
                      <span>{option}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                className="mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.6 }}
              >
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedOption}
                  loading={isVoting}
                >
                  Submit
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
