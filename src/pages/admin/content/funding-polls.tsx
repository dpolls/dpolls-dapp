"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui_v2/avatar";
import { Badge } from "@/components/ui_v2/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui_v2/card";
import { WalletConnector } from "@/components/wallet/wallet-connector";
import { POLLS_DAPP_ABI, } from '@/constants/abi';
import { useSendUserOp, useSignature } from '@/hooks';
import { PollState } from "@/types/poll";
import { getCompressedAddress } from "@/utils/addressUtil";
import { computePercentage } from "@/utils/mathUtils";
import { calculateTimeLeft } from "@/utils/timeUtils";
import { Button, Form, Input, InputNumber, Modal, Result, Select } from 'antd';
import { ethers } from 'ethers';
import { CircleDollarSign, Clock, Users } from "lucide-react";
import { useState, useEffect, useContext } from "react";
import { ConfigContext } from '@/contexts';
import { useToast } from '@/components/ui_v3/use-toast';

interface FundingPollsProps {
  polls: PollState[]
  fetchPolls: () => void
  handleTabChange: (tab: string) => void
  isWalletConnected: boolean
  setIsWalletConnected: (isWalletConnected: boolean) => void
}

export default function FundingPolls({ polls, fetchPolls, handleTabChange, isWalletConnected, setIsWalletConnected }: FundingPollsProps) {
  const { isConnected } = useSignature();
  // Filter polls based on their status
  const fundingPolls = polls.filter(poll => poll.status === "for-funding")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fundingPolls.map((poll: PollState) => (
          <PollCard
            key={poll.id}
            poll={poll}
            type="funding"
            fetchPolls={fetchPolls}
          />
        ))}
        {fundingPolls.length === 0 && (
          <div className="col-span-3 text-center py-10">
            {isConnected ?
              <>
                <Result
                  status="404"
                  title="Oops!"
                  subTitle="No polls are currently open for funding"
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

function PollCard({ poll, type, fetchPolls }:
  { poll: PollState, type: string, fetchPolls: () => void }) {

  const config = useContext(ConfigContext);
  const { toast } = useToast();
  const selectAfter = (
    <Select defaultValue="NERO" style={{ width: "auto" }}>
      <Select.Option value="NERO">NERO</Select.Option>
    </Select>
  );

  const { isConnected, } = useSignature();
  const { execute, waitForUserOpResult, sendUserOp } = useSendUserOp();
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);

  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [form] = Form.useForm();

  // Initialize form with contribution value
  useEffect(() => {
    const funds = parseFloat(ethers.utils.formatEther(poll.funds || '0'));
    const targetFund = parseFloat(ethers.utils.formatEther(poll.targetFund || '0'));
    const remainingAmount = (targetFund - funds).toFixed(3);
    form.setFieldsValue({ contribution: remainingAmount });
  }, [poll.funds, poll.targetFund, form]);

  const handleFundPollLocal = async (poll: any) => {
    if (!isConnected) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!config?.chains[config?.currentNetworkIndex]?.dpolls?.contractAddress) {
      toast({
        title: "Error",
        description: "Contract address not configured",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    const amount = form.getFieldValue("contribution");
    const ethAmount = ethers.utils.parseEther(amount);

    try {
      await execute({
        function: 'fundPoll',
        contractAddress: config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        abi: POLLS_DAPP_ABI, // Use the specific ABI with mint function
        params: [
          poll.id,
        ],
        value: ethAmount,
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
      setIsFundingModalOpen(false);
    }

  };

  const modOptions = poll.options.map((option: string, index: number) => {
    return { text: option, percentage: computePercentage(poll.responses, index.toString()) };
  });

  const funds = parseFloat(ethers.utils.formatEther(poll.funds || '0'));
  const targetFund = parseFloat(ethers.utils.formatEther(poll.targetFund || '0'));
  const targetReached = funds >= targetFund;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{poll.subject || poll.title || poll.question}</CardTitle>
          <StatusBadge status={poll.status} />
        </div>
        <CardDescription className="line-clamp-2">{poll.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Clock className="h-4 w-4" />
          <span>{poll.endDate ? calculateTimeLeft(poll.endDate) : `${poll.duration} days`}</span>
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
            onClick={() => setIsFundingModalOpen(true)}
            disabled={targetReached}>
            {targetReached ? 'Target Reached' : 'Fund'}
          </Button>
        </div>
      </CardFooter>
      <Modal
        title={"Fund poll: " + poll.subject || poll.title || poll.question}
        open={isFundingModalOpen}
        maskClosable={false}
        onCancel={() => setIsFundingModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={async () => {
              await handleFundPollLocal(poll);
              setIsFundingModalOpen(false);
            }}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" loading={isLoading} onClick={() => {
            setIsFundingModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
        <Form
          layout={"horizontal"}
          form={form}
          name="basicInfo"
          style={{ maxWidth: 600, margin: '0 auto' }}
        >
          {/* <div style={contentStyle}>{stepItems[current].content}</div> */}
          <Form.Item
            label="Fund"
            name="contribution"
            rules={[{ required: true, message: 'Please enter amount to contribute' }]}
            style={{ textAlign: 'center' }}
          >
            <InputNumber
              placeholder="Amount in ETH"
              min="0.001"
              step="0.001"
              addonAfter={selectAfter}
              stringMode
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
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