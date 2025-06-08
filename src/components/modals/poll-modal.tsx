"use client"

import { useState } from "react"
import { useSignature, useConfig, useSendUserOp } from '@/hooks';
import { POLLS_DAPP_ABI,  } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import { computePercentage } from '@/utils/mathUtils';

import { Tag } from "antd"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui_v3/dialog"
import { Button } from "@/components/ui_v3/button"
import { Badge } from "@/components/ui_v3/badge"
import { Progress } from "@/components/ui_v3/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui_v3/radio-group"
import { Label } from "@/components/ui_v3/label"
import { Separator } from "@/components/ui_v3/separator"
import { Users, Trophy, Clock, Vote, Share2, ExternalLink, CheckCircle } from "lucide-react"
import Image from "next/image"
import { PollState } from "@/types/poll"
import { ethers } from "ethers"
import { calculateTimeLeft } from "@/utils/timeUtils"
import { getCompressedAddress } from "@/utils/addressUtil"

interface PollOption {
  id: string
  text: string
  votes: number
  percentage: number
  image?: string
}

interface PollModalProps {
  featureFlagNew: boolean
  poll: PollState | null | any
  isOpen: boolean
  onClose: () => void
  fetchPolls: () => void
}

export function PollModal({ featureFlagNew, poll, isOpen, onClose, fetchPolls }: PollModalProps) {
  console.log('featureFlagNew', featureFlagNew)
  console.log('modal poll', poll)
  const [selectedOption, setSelectedOption] = useState<string>("")
  const [hasVoted, setHasVoted] = useState(poll?.userHasVoted || false)

  const { isConnected, } = useSignature();
  const { execute, waitForUserOpResult } = useSendUserOp();
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  if (!poll) return null

  const handleOptionVote = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsVoting(true);
    setUserOpHash(null);
    setTxStatus('');

    console.log('selectedOption', selectedOption)

    try {
      await execute({
        function: 'submitResponse',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: POLLS_DAPP_ABI, // Use the specific ABI with mint function
        params: [
          poll.id,
          selectedOption.toString(),
        ],
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
      setIsVoting(false);
      onClose();
    }

  };

  const modOptions = poll.options.map((option: string, index: number) => {
    return { 
      id: index,
      text: option,
      votes: poll.responses.length,
      percentage: computePercentage(poll.responses, index.toString()) 
    };
  });
  console.log('modOptions', modOptions)

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: poll.title,
        text: poll.description,
        url: window.location.href,
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "for-claiming":
        return "destructive"
      case "closed":
        return "outline"
      default:
        return "default"
    }
  }

  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Tag
                  color={
                    poll.status === "new" ? "#108ee9" : poll.status === "for-claiming" ? "#f50" : "#87d068"
                  }
                >
                  {poll.category}
                </Tag>
                {poll.status && <Badge className="text-white" variant={getStatusColor(poll.status)}>{poll.status}</Badge>}
              </div>
              <DialogTitle className="text-2xl font-bold mb-2">{poll.subject}</DialogTitle>
              <p className="text-muted-foreground">{poll.description}</p>
            </div>
            <div className="flex gap-2 ml-4">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              {/* <Button variant="outline" size="sm" asChild>
                <a href={`/polls/${poll.id}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button> */}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Poll Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Participants</p>
                <p className="font-semibold">
                {featureFlagNew ? 
                  parseFloat(ethers.utils.formatEther(poll.targetFund || '0'))
                  :
                  poll.participants.toLocaleString()
                }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Prize Pool</p>
                <p className="font-semibold">
                  {featureFlagNew ? 
                    parseFloat(ethers.utils.formatEther(poll.targetFund || '0'))
                    :
                    poll.prize
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Time Left</p>
                <p className="font-semibold">
                  {featureFlagNew ? 
                    poll.endDate && calculateTimeLeft(poll.endDate)
                    :
                    poll.timeLeft
                  }
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Voting Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Cast Your Vote</h3>
              <p className="text-sm text-muted-foreground">Total votes: 
                {featureFlagNew ? 
                  poll.responses.length
                  :
                  poll.totalVotes.toLocaleString()
                }
              </p>
            </div>

            {hasVoted ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 mb-4">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">You have voted! Here are the current results:</span>
                </div>

                {modOptions.map((option: PollOption) => (
                  <div key={option.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {poll.viewType === "gallery" && option.image && (
                          <Image
                            src={option.image || "/placeholder.svg"}
                            alt={option.text}
                            width={40}
                            height={40}
                            className="rounded object-cover"
                          />
                        )}
                        <span className="font-medium">{option.text}</span>
                        {selectedOption === option.text && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Your vote
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{option.percentage.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">{option.votes} votes</p>
                      </div>
                    </div>
                    <Progress value={option.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                  {modOptions.map((option: PollOption) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <RadioGroupItem value={option.id} id={option.id} />
                      {poll.viewType === "gallery" && option.image && (
                        <Image
                          src={option.image || "/placeholder.svg"}
                          alt={option.text}
                          width={60}
                          height={60}
                          className="rounded object-cover"
                        />
                      )}
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer font-medium">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <Button onClick={handleOptionVote} disabled={!selectedOption || isVoting} className="w-full text-white" size="lg">
                  {isVoting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Submitting Vote...
                    </>
                  ) : (
                    <>
                      <Vote className="h-4 w-4 mr-2" />
                      Cast Vote
                    </>
                  )}
                </Button>

                {poll.status === "Ended" && (
                  <p className="text-center text-muted-foreground text-sm">
                    This poll has ended. You can no longer vote.
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Poll Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created by</p>
                <p className="font-medium">{getCompressedAddress(poll.creator)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
