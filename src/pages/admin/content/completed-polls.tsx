"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui_v2/avatar";
import { Badge } from "@/components/ui_v2/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui_v2/card";
import { WalletConnector } from "@/components/wallet/wallet-connector";
import { useSendUserOp, useSignature } from '@/hooks';
import { PollState } from "@/types/poll";
import { getCompressedAddress } from "@/utils/addressUtil";
import { computePercentage } from "@/utils/mathUtils";
import { Button, Form, Input, Modal, Result } from 'antd';
import { ethers } from 'ethers';
import { CircleDollarSign, Clock, Users, Heart } from "lucide-react";
import { useState, useEffect, useContext } from "react";
import { handleClaimRemainingFunds, handleDonateRemainingFunds } from '@/utils/pollUtils';
import ReactConfetti from 'react-confetti';
import { ConfigContext } from '@/contexts';
import { useToast } from '@/components/ui_v3/use-toast';

interface CompletedPollsProps {
  AAaddress: string
  polls: PollState[]
  fetchPolls: () => void
  handleTabChange: (tab: string) => void
  isWalletConnected: boolean
  setIsWalletConnected: (isWalletConnected: boolean) => void
}

export default function CompletedPolls({ AAaddress, polls, fetchPolls, handleTabChange, isWalletConnected, setIsWalletConnected}: CompletedPollsProps) {

  const { isConnected } = useSignature();
  // Filter polls based on their status
  const targetPolls = polls.filter(poll => poll.status === "closed" || poll.status === "cancelled")
  console.log('target poll', targetPolls)

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
                  subTitle="No closed polls."
                />
                <Button className="mt-4" onClick={() => handleTabChange('create-poll')}>
                  Create Your First Poll
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
  const { toast } = useToast();
  console.log('poll', poll)
  const isCreator = poll.creator.toLowerCase() === AAaddress.toLowerCase();
  console.log('isCreator', isCreator)

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

  const onClaimRemainingFunds = () => {
    if (!config?.chains[config?.currentNetworkIndex]?.dpolls?.contractAddress) {
      toast({
        title: "Error",
        description: "Contract address not configured",
        variant: "destructive",
      });
      return;
    }
    handleClaimRemainingFunds(
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
      config.chains[config.currentNetworkIndex].dpolls.contractAddress
    );
  };

  const onDonateRemainingFunds = () => {
    if (!config?.chains[config?.currentNetworkIndex]?.dpolls?.contractAddress) {
      toast({
        title: "Error",
        description: "Contract address not configured",
        variant: "destructive",
      });
      return;
    }
    handleDonateRemainingFunds(
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
      config.chains[config.currentNetworkIndex].dpolls.contractAddress,
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
            disabled={!isCreator || funds === 0}
            onClick={() => setIsModalOpen(true)}>
            {!isCreator ? 'Not Creator' : funds === 0 ? 'No Funds' : 'Refund'}
          </Button>
          {isCreator && funds > 0 && (
            <Button 
              block 
              variant="outlined" 
              size="small" 
              type="primary"
              onClick={() => setIsDonateModalOpen(true)}
              icon={<Heart className="h-3 w-3" />}>
              Donate
            </Button>
          )}
        </div>
      </CardFooter>
      
      {/* Refund Modal */}
      <Modal
        title={"Claim Remaining Funds for poll: " + poll.subject}
        open={isModalOpen}
        maskClosable={false}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={onClaimRemainingFunds}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" loading={isLoading} onClick={() => {
            setIsModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
        <p>Are you sure you want to claim the remaining funds ({funds} NERO) for this poll?</p>
      </Modal>

      {/* Donate Modal */}
      <Modal
        title={"Donate Remaining Funds to Community Fund for poll: " + poll.subject}
        open={isDonateModalOpen}
        maskClosable={false}
        onCancel={() => setIsDonateModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isDonateLoading}
            onClick={onDonateRemainingFunds}
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
          <p className="text-lg font-medium mb-2">Donate Your Remaining Funds</p>
          <p className="text-muted-foreground">
            Instead of claiming your remaining funds, you can donate them to the community fund. 
            This helps support future polls and the overall ecosystem.
          </p>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-blue-600 dark:text-blue-400 font-medium">
              Amount to donate: {funds} NERO
            </p>
          </div>
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
              Successfully donated remaining funds from poll: {poll.subject}
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
}