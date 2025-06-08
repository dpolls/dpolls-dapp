"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui_v2/avatar";
import { Badge } from "@/components/ui_v2/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui_v2/card";
import { WalletConnector } from "@/components/wallet/wallet-connector";
import { POLLS_DAPP_ABI, } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import { useSendUserOp, useSignature } from '@/hooks';
import { PollState } from "@/types/poll";
import { getCompressedAddress } from "@/utils/addressUtil";
import { computePercentage } from "@/utils/mathUtils";
import { calculateTimeLeft } from "@/utils/timeUtils";
import { Button, Form, Input, Modal, Result } from 'antd';
import { ethers } from 'ethers';
import { CircleDollarSign, Clock, Users } from "lucide-react";
import { useState } from "react";
import { handleClaimRewards } from '@/utils/pollUtils';

interface ClaimingPollsProps {
  AAaddress: string
  polls: PollState[]
  fetchPolls: () => void
  handleTabChange: (tab: string) => void
  isWalletConnected: boolean
  setIsWalletConnected: (isWalletConnected: boolean) => void
}

export default function ClaimingPolls({ AAaddress, polls, fetchPolls, handleTabChange, isWalletConnected, setIsWalletConnected }: ClaimingPollsProps) {

  const { isConnected } = useSignature();
  // Filter polls based on their status
  const targetPolls = polls.filter(poll => poll.status === "for-claiming")
  console.log('for claiming', targetPolls)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {targetPolls.map((poll: PollState) => (
          <PollCard
            key={poll.id}
            poll={poll}
            type="funding"
            fetchPolls={fetchPolls}
            AAaddress={AAaddress}
          />
        ))}
        {targetPolls.length === 0 && (
          <div className="col-span-3 text-center py-10">
            {isConnected ?
              <>
                <Result
                  status="404"
                  title="Oops!"
                  subTitle="No rewards to claim. Respond to polls to be eligible for rewards."
                />
                <Button className="mt-4" onClick={() => handleTabChange('active-polls')}>
                  View Active Polls
                </Button>
              </>
              :
              <WalletConnector isWalletConnected={isWalletConnected} setIsWalletConnected={setIsWalletConnected} />
            }
          </div>
        )}
      </div>
    </div>
  )
}

function PollCard({ poll, type, fetchPolls, AAaddress }:
  { poll: PollState, type: string, fetchPolls: () => void, AAaddress: string }) {

  const isClaimed = poll.responsesWithAddress?.some(response => response.address === AAaddress && response.isClaimed);
  const hasVoted = poll.responsesWithAddress?.some(response => response.address === AAaddress);

  const { isConnected, } = useSignature();
  const { execute, waitForUserOpResult } = useSendUserOp();
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onClaimRewards = () => {
    handleClaimRewards(
      poll,
      isConnected,
      execute,
      waitForUserOpResult,
      fetchPolls,
      setUserOpHash,
      setTxStatus,
      setIsPolling,
      setIsLoading,
      setIsModalOpen
    );
  };

  const modOptions = poll.options.map((option: string, index: number) => {
    return { text: option, percentage: computePercentage(poll.responses, index.toString()) };
  });

  const funds = parseFloat(ethers.utils.formatEther(poll.funds || '0'));
  const targetFund = parseFloat(ethers.utils.formatEther(poll.targetFund || '0'));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{poll.subject}</CardTitle>
          <StatusBadge status={poll.status} />
        </div>
        <CardDescription className="line-clamp-2">{poll.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Clock className="h-4 w-4" />
          <span>{calculateTimeLeft(poll.endDate)}</span>
          <span className="mx-1">•</span>
          <Users className="h-4 w-4" />
          <span>{poll.totalResponses} / {poll.maxResponses} votes</span>
          <CircleDollarSign className="h-4 w-4" />
          <span>{funds} / {targetFund} NERO </span>
        </div>

        <div className="space-y-2">
          {(modOptions || []).slice(0, 3).map((option, index) => (
            <div key={index} className="relative pt-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-muted-foreground">{typeof option === 'string' ? option : option.text}</span>
                <span className="text-xs font-medium text-muted-foreground">{typeof option === 'string' ? '0' : option.percentage}%</span>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                <div
                  style={{ width: `${typeof option === 'string' ? 0 : option.percentage}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                ></div>
              </div>
            </div>
          ))}
          {(modOptions || []).length > 3 && (
            <div className="text-xs text-center text-muted-foreground mt-1">
              +{modOptions.length - 3} more options
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="flex items-center">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`/placeholder.svg?height=24&width=24`} alt="Creator" />
            <AvatarFallback>{poll.creator.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{getCompressedAddress(poll.creator)}</span>
        </div>
        <div className="flex">
          <Button block variant="outlined" size="small" type="primary"
            disabled={isClaimed || !hasVoted}
            onClick={() => setIsModalOpen(true)}>
            {isClaimed ? 'Already Claimed' : 'Claim'}
          </Button>
        </div>
      </CardFooter>
      <Modal
        title={"Claim Rewards for poll: " + poll.subject}
        open={isModalOpen}
        maskClosable={false}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={onClaimRewards}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" loading={isLoading} onClick={() => {
            setIsModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
      </Modal>
    </Card>
  )
}

function StatusBadge({ status }) {
  if (status === "active" || status === "open") {
    return (
      <Badge variant="default" className="bg-green-500">
        Active
      </Badge>
    )
  } else if (status === "new") {
    return (
      <Badge variant="default" className="bg-blue-500">
        New
      </Badge>
    )
  } else if (status === "for-funding") {
    return (
      <Badge variant="default" className="bg-blue-500">
        Funding
      </Badge>
    )
  } else if (status === "closed") {
    return <Badge variant="secondary">Ended</Badge>
  } else if (status === "for-claiming") {
    return (
      <Badge variant="outline" className="text-yellow-500 border-yellow-500">
        For Claiming
      </Badge>
    )
  }
}