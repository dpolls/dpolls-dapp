"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui_v2/avatar";
import { Badge } from "@/components/ui_v2/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui_v2/card";
import { WalletConnector } from "@/components/wallet/wallet-connector";
import { useSendUserOp, useSignature } from '@/hooks';
import { PollState } from "@/types/poll";
import { getCompressedAddress } from "@/utils/addressUtil";
import { computePercentage } from "@/utils/mathUtils";
import { calculateTimeLeft } from "@/utils/timeUtils";
import { Button, Form, Input, Modal, Result } from 'antd';
import { ethers } from 'ethers';
import { CircleDollarSign, Clock, Users, Heart } from "lucide-react";
import { useState, useEffect, useContext } from "react";
import { handleClaimRewards, handleDonateRewards } from '@/utils/pollUtils';
import ReactConfetti from 'react-confetti';
import { ConfigContext } from '@/contexts';

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

  const config = useContext(ConfigContext);
  const isClaimed = poll.responsesWithAddress?.some(response => response.address === AAaddress && response.isClaimed);
  const hasVoted = poll.responsesWithAddress?.some(response => response.address === AAaddress);

  const { isConnected, } = useSignature();
  const { execute, waitForUserOpResult } = useSendUserOp();
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isThankYouModalOpen, setIsThankYouModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDonateLoading, setIsDonateLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      setIsModalOpen,
      config?.chains[config?.currentNetworkIndex].dpolls.contractAddress
    );
  };

  const onDonateRewards = () => {
    handleDonateRewards(
      poll,
      isConnected,
      execute,
      waitForUserOpResult,
      fetchPolls,
      setUserOpHash,
      setTxStatus,
      setIsPolling,
      setIsDonateLoading,
      setIsDonateModalOpen,
      config?.chains[config?.currentNetworkIndex].dpolls.contractAddress ?? '',
      () => {
        setIsThankYouModalOpen(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
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
        <div className="flex gap-2">
          <Button 
            block 
            variant="outlined" 
            size="small" 
            type="primary"
            disabled={isClaimed || !hasVoted}
            onClick={() => setIsModalOpen(true)}>
            {isClaimed ? 'Already Claimed' : 'Claim'}
          </Button>
          {/* {!isClaimed && (
            <Button
              block
              variant="outlined"
              size="small"
              type="primary"
              disabled={isClaimed || !hasVoted}
              onClick={() => setIsDonateModalOpen(true)}
              icon={<Heart className="h-3 w-3" />}>
              Donate
            </Button>
          )} */}
        </div>
      </CardFooter>
      
      {/* Claim Modal */}
      <Modal
        title={
          <span style={{ whiteSpace: 'break-spaces', wordBreak: 'break-word', width: '95%', display: 'block'}}>
            {"Claim Rewards for poll: " + poll.subject}
          </span>
        }
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

      {/* Donate Modal */}
      <Modal
        title={"Donate Rewards to Community Fund for poll: " + poll.subject}
        open={isDonateModalOpen}
        maskClosable={false}
        onCancel={() => setIsDonateModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isDonateLoading}
            onClick={onDonateRewards}
            icon={<Heart className="h-4 w-4" />}>
            Yes, Donate
          </Button>,
          <Button key="back" variant="outlined" loading={isDonateLoading} onClick={() => {
            setIsDonateModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
        <div className="text-center py-4">
          <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Donate Your Rewards</p>
          <p className="text-muted-foreground">
            Instead of claiming your rewards, you can donate them to the community fund. 
            This helps support future polls and the overall ecosystem.
          </p>
        </div>
      </Modal>

      {/* Thank You Modal */}
      <Modal
        title="Thank You for Your Donation!"
        open={isThankYouModalOpen}
        maskClosable={true}
        onCancel={() => setIsThankYouModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsThankYouModalOpen(false)}>
            Close
          </Button>,
        ]}
      >
        <div className="text-center py-4">
          {showConfetti && (
            <ReactConfetti
              width={windowSize.width}
              height={windowSize.height}
              recycle={false}
              numberOfPieces={200}
              gravity={0.3}
            />
          )}
          <Heart className="h-16 w-16 text-red-500 mx-auto mb-4 animate-bounce" />
          <p className="text-xl font-medium mb-4">Thank You for Your Generosity!</p>
          <p className="text-muted-foreground mb-4">
            Your donation to the community fund will help support future polls and strengthen our ecosystem.
            Together, we're building a better community!
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-green-600 dark:text-green-400 font-medium">
              Successfully donated rewards from poll: {poll.subject}
            </p>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
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
  return null;
}