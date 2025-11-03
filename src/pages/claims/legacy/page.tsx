"use client"

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui_v2/avatar";
import { Badge } from "@/components/ui_v2/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui_v2/card";
import { Alert, AlertDescription } from "@/components/ui_v3/alert";
import { WalletConnector } from "@/components/wallet/wallet-connector";
import { useSendUserOp, useSignature, useConfig } from '@/hooks';
import { PollState } from "@/types/poll";
import { getCompressedAddress } from "@/utils/addressUtil";
import { computePercentage } from "@/utils/mathUtils";
import { calculateTimeLeft } from "@/utils/timeUtils";
import { Button, Modal, Result } from 'antd';
import { ethers } from 'ethers';
import { CircleDollarSign, Clock, Users, AlertTriangle, Send } from "lucide-react";
import { handleClaimRewards } from '@/utils/pollUtils';
import { POLLS_DAPP_LEGACY_ABI } from '@/constants/abi';
import { convertTimestampToDate } from '@/utils/format';
import LandingPageHeader from "@/pages/landing/landing-header";
import { useNavigate } from 'react-router-dom';

export default function LegacyClaimsPage() {
  const { AAaddress, isConnected } = useSignature();
  const config = useConfig();
  const navigate = useNavigate();
  const [polls, setPolls] = useState<PollState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  useEffect(() => {
    if (isConnected && AAaddress) {
      fetchLegacyPolls();
    }
  }, [isConnected, AAaddress, config]);

  const fetchLegacyPolls = async () => {
    const legacyContractAddress = import.meta.env.VITE_LEGACY_DPOLLS_CONTRACT_ADDRESS;

    if (!legacyContractAddress) {
      console.error('Legacy contract address not configured');
      return;
    }

    try {
      setIsLoading(true);

      // Use the RPC URL from the current network configuration
      const rpcUrl = config.chains[config.currentNetworkIndex].chain.rpc;
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      const pollsContract = new ethers.Contract(
        legacyContractAddress,
        POLLS_DAPP_LEGACY_ABI,
        provider
      );

      const allPollIds = await pollsContract.getAllPollIds();
      console.log('allPollIds', allPollIds);

      if (allPollIds.length > 0) {
        const fetchedPolls: PollState[] = await Promise.all(
          allPollIds.map(async (pollId: number) => {
            try {
              const pollDetails = await pollsContract.getPoll(pollId);
              const pollResponses = await pollsContract.getPollResponses(pollId);

              const modPollResponses = pollResponses?.map((response: any) => response.response);
              const pollResponsesWithAddress = pollResponses?.map((response: any) => ({
                address: response.responder,
                response: response.response,
                isClaimed: response.isClaimed,
                weight: response.weight,
                timestamp: convertTimestampToDate(Number(response.timestamp)),
                reward: response.reward
              }));

              return {
                id: pollId,
                creator: pollDetails.creator,
                subject: pollDetails.subject,
                description: pollDetails.description,
                category: pollDetails.category,
                status: pollDetails.status,
                createdAt: new Date(Number(pollDetails.endTime) * 1000 - Number(pollDetails.durationDays) * 24 * 60 * 60 * 1000),
                options: pollDetails.options,
                rewardPerResponse: pollDetails.rewardPerResponse.toString(),
                maxResponses: pollDetails.maxResponses.toString(),
                endDate: new Date(Number(pollDetails.endTime) * 1000),
                isOpen: pollDetails.isOpen,
                totalResponses: pollResponsesWithAddress.length,
                funds: pollDetails.funds.toString(),
                minContribution: pollDetails.minContribution.toString(),
                targetFund: pollDetails.targetFund.toString(),
                responses: modPollResponses,
                responsesWithAddress: pollResponsesWithAddress,
                viewType: pollDetails.viewType,
                rewardToken: pollDetails.rewardToken,
                fundingType: pollDetails.fundingType,
                rewardDistribution: pollDetails.rewardDistribution,
                projectId: '0' // Legacy contract doesn't have projectId
              };
            } catch (error) {
              console.error(`Error fetching poll ${pollId}:`, error);
              return null;
            }
          })
        );

        // Filter out null values and show all polls regardless of status
        const validPolls = fetchedPolls.filter(poll => poll !== null);

        setPolls(validPolls);
      } else {
        setPolls([]);
      }
    } catch (error) {
      console.error('Error fetching legacy polls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingPageHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Warning Banner */}
        <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>Legacy Contract Overview:</strong> View all polls and responders from the old contract.
            You can request poll creators to change the status to "for-claiming" so responders can claim their rewards.
            Please note: After migration, these rewards may no longer be accessible.
          </AlertDescription>
        </Alert>

        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Legacy Contract Polls</h1>
              <p className="text-muted-foreground">
                View all legacy polls, their responders, and claim status. Request creators to update poll status to enable claims.
              </p>
            </div>
            <Button
              type="primary"
              icon={<Send className="h-4 w-4" />}
              onClick={() => navigate('/claims_legacy_distribute')}
              className="flex items-center gap-2"
            >
              Distribute Rewards
            </Button>
          </div>
        </div>

        {!isConnected ? (
          <div className="text-center py-10">
            <WalletConnector isWalletConnected={isWalletConnected} setIsWalletConnected={setIsWalletConnected} />
          </div>
        ) : isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading legacy claims...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {polls.map((poll: PollState) => (
              <PollCard
                key={poll.id}
                poll={poll}
                fetchPolls={fetchLegacyPolls}
                AAaddress={AAaddress}
              />
            ))}
            {polls.length === 0 && (
              <div className="col-span-3 text-center py-10">
                <Result
                  status="info"
                  title="No Legacy Polls Found"
                  subTitle="No polls found in the legacy contract, or there was an error loading the data. Please try again later."
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PollCard({ poll, fetchPolls, AAaddress }: { poll: PollState, fetchPolls: () => void, AAaddress: string }) {
  const isClaimed = poll.responsesWithAddress?.some(response =>
    response.address.toLowerCase() === AAaddress.toLowerCase() && response.isClaimed
  );
  const hasVoted = poll.responsesWithAddress?.some(response =>
    response.address.toLowerCase() === AAaddress.toLowerCase()
  );

  const { isConnected } = useSignature();
  const { execute, waitForUserOpResult } = useSendUserOp();
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const legacyContractAddress = import.meta.env.VITE_LEGACY_DPOLLS_CONTRACT_ADDRESS;

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
      legacyContractAddress
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
          <Badge variant="outline" className="text-yellow-600 border-yellow-500">
            Legacy
          </Badge>
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
          <span>{funds.toFixed(4)} / {targetFund.toFixed(4)} NERO</span>
        </div>

        <div className="space-y-2">
          {(modOptions || []).slice(0, 3).map((option, index) => (
            <div key={index} className="relative pt-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {typeof option === 'string' ? option : option.text}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {typeof option === 'string' ? '0' : option.percentage}%
                </span>
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

        {/* Responders List */}
        {poll.responsesWithAddress && poll.responsesWithAddress.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground">
                Responders ({poll.responsesWithAddress.length})
              </h4>
              <Badge variant="secondary" className="text-xs">
                Status: {poll.status}
              </Badge>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {poll.responsesWithAddress.map((response, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar className="h-4 w-4 flex-shrink-0">
                      <AvatarFallback className="text-[8px]">
                        {response.address.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-mono truncate">
                      {getCompressedAddress(response.address)}
                    </span>
                  </div>
                  <Badge
                    variant={response.isClaimed ? "default" : "outline"}
                    className="text-[10px] ml-2 flex-shrink-0"
                  >
                    {response.isClaimed ? "Claimed" : "Unclaimed"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="flex items-center">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`/placeholder.svg?height=24&width=24`} alt="Creator" />
            <AvatarFallback>{poll.creator.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="ml-2 text-xs text-muted-foreground">{getCompressedAddress(poll.creator)}</span>
        </div>
        <Button
          block
          variant="outlined"
          size="small"
          type="primary"
          disabled={isClaimed || !hasVoted}
          onClick={() => setIsModalOpen(true)}>
          {isClaimed ? 'Already Claimed' : 'Claim Reward'}
        </Button>
      </CardFooter>

      {/* Claim Modal */}
      <Modal
        title={
          <span style={{ whiteSpace: 'break-spaces', wordBreak: 'break-word', width: '95%', display: 'block'}}>
            {"Claim Legacy Rewards for: " + poll.subject}
          </span>
        }
        open={isModalOpen}
        maskClosable={false}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading} onClick={onClaimRewards}>
            Claim Now
          </Button>,
          <Button key="back" variant="outlined" loading={isLoading} onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>,
        ]}
      >
        <div className="py-4">
          <p className="mb-4">Are you sure you want to claim your rewards from this legacy poll?</p>
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
              This will claim rewards from the legacy contract.
            </AlertDescription>
          </Alert>
        </div>
      </Modal>
    </Card>
  );
}
