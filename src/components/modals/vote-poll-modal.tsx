"use client"

import { SendUserOpContext } from '@/contexts';
import { useSendUserOp, useSignature } from '@/hooks';

import { POLLS_DAPP_ABI, } from '@/constants/abi';
import { useContext, useEffect, useState, useRef } from "react";

import { Badge } from "@/components/ui_v3/badge";
import { Button } from "@/components/ui_v3/button";
import { Label } from "@/components/ui_v3/label";
import { Progress } from "@/components/ui_v3/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui_v3/radio-group";
import { Separator } from "@/components/ui_v3/separator";
import { Captcha, CaptchaRef } from "@/components/ui/captcha";
import { PollState } from "@/types/poll";
import { getCompressedAddress } from "@/utils/addressUtil";
import { calculateTimeLeft } from "@/utils/timeUtils";
import { getTagColor } from "@/utils/tagColors";
import { Modal, Tag, Form, InputNumber, Select } from "antd";
import { ethers } from "ethers";
import { CheckCircle, Clock, Share2, Trophy, Users, Vote, CircleDollarSign } from "lucide-react";
import Image from "next/image";
import { computePercentage } from '@/utils/mathUtils';
import { ConfigContext } from '@/contexts';
import { useToast } from '@/components/ui_v3/use-toast';

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
  isViewOnly?: boolean
}

export function VotePollModal({ featureFlagNew, poll, isOpen, onClose, fetchPolls }: PollModalProps) {
  const config = useContext(ConfigContext);
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<string>("")
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const { isConnected, AAaddress } = useSignature();
  const { execute, waitForUserOpResult } = useSendUserOp();
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<CaptchaRef>(null);

  const hasVoted = poll?.responsesWithAddress?.some((response: any) => response.address === AAaddress);

  const { isWalletPanel, setIsWalletPanel } = useContext(SendUserOpContext)!
  const [isWalletConnected, setIsWalletConnected] = useState(false)

  // Function to fetch updated poll data from contract
  const fetchUpdatedPollData = async (pollId: number) => {
    if (!config?.chains[config?.currentNetworkIndex]?.dpolls?.contractAddress) {
      console.error("Contract address not configured");
      return null;
    }

    try {
      const rpcUrl = config.chains[config.currentNetworkIndex].chain.rpc;
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(
        config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        POLLS_DAPP_ABI,
        provider
      );

      // Fetch poll data
      const pollData = await contract.getPoll(pollId);
      const responses = await contract.getPollResponses(pollId);

      // Transform the data to match PollState interface
      const updatedPoll = {
        ...poll,
        totalResponses: pollData.totalResponses.toNumber(),
        funds: pollData.funds.toString(),
        status: pollData.status,
        isOpen: pollData.isOpen,
        responses: responses.map((response: any) => response.response),
        responsesWithAddress: responses.map((response: any) => ({
          address: response.responder,
          response: response.response,
          isClaimed: response.isClaimed,
          weight: response.weight.toNumber(),
          timestamp: new Date(response.timestamp.toNumber() * 1000),
          reward: response.reward.toString()
        }))
      };

      return updatedPoll;
    } catch (error) {
      console.error('Error fetching updated poll data:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!isWalletConnected) {
      setIsWalletPanel(false)
    }
  }, [isWalletConnected, setIsWalletPanel])

  // Reset selected option and captcha when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedOption("");
      setCaptchaToken(null);
      captchaRef.current?.reset();
    }
  }, [isOpen])

  // Set initial form value when modal opens
  useEffect(() => {
    if (isFundingModalOpen && poll?.targetFund) {
      const targetFund = ethers.utils.formatEther(poll.targetFund);
      const currentFunds = ethers.utils.formatEther(poll.funds || '0');
      const initialValue = (parseFloat(targetFund) - parseFloat(currentFunds)).toString();
      form.setFieldsValue({ contribution: initialValue });
    }
  }, [isFundingModalOpen, poll?.targetFund, poll?.funds, form]);

  if (!poll) return null

  const handleOptionVote = async () => {
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

    setIsVoting(true);
    setUserOpHash(null);
    setTxStatus('');

    // Execute reCAPTCHA v3 before submitting
    try {
      const token = await captchaRef.current?.execute();
      if (!token) {
        toast({
          title: "Error",
          description: "reCAPTCHA verification failed. Please try again.",
          variant: "destructive",
        });
        setIsVoting(false);
        return;
      }
      setCaptchaToken(token);
      await execute({
        function: 'submitResponse',
        contractAddress: config.chains[config.currentNetworkIndex].dpolls.contractAddress,
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
        
        // Reset captcha after successful vote
        setCaptchaToken(null);
        captchaRef.current?.reset();
        
        // Fetch updated poll data instead of calling fetchPolls
        const updatedPoll = await fetchUpdatedPollData(poll.id);
        if (updatedPoll) {
          // Update the poll object with new data
          Object.assign(poll, updatedPoll);
        }
      } else if (result.transactionHash) {
        setTxStatus('Transaction hash: ' + result.transactionHash);
      }
    } catch (error) {
      console.error('Error:', error);
      setTxStatus('An error occurred');
      // Reset captcha on error so user can try again
      setCaptchaToken(null);
      captchaRef.current?.reset();
    } finally {
      setIsVoting(false);
    }

  };

  const modOptions = poll.options.map((option: string, index: number) => {
    return {
      id: index,
      text: option,
      votes: poll.responses.filter((response: string) => response === index.toString()).length,
      percentage: computePercentage(poll.responses, index.toString())
    };
  });

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

  function renderNotOpenMessage(poll: any): import("react").ReactNode {
    switch (poll.status) {
      case "open":
        return null
      case "active":
        return null
      case "for-claiming":
        return "Claim your rewards"
      case "closed":
        return "This poll is closed and no longer accepting responses."
      default:
        return null
    }
  }

  const handleFundPollLocal = async () => {
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
        abi: POLLS_DAPP_ABI,
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
        
        // Fetch updated poll data instead of calling fetchPolls
        const updatedPoll = await fetchUpdatedPollData(poll.id);
        if (updatedPoll) {
          // Update the poll object with new data
          Object.assign(poll, updatedPoll);
        }
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

  const selectAfter = (
    <Select defaultValue="NERO" style={{ width: "auto" }}>
      <Select.Option value="NERO">NERO</Select.Option>
    </Select>
  );

  // Determine if poll is ended
  const isPollEnded = poll.status === 'closed' || calculateTimeLeft(poll.endDate) === 'Ended';

  return (
    <Modal
      title={<span style={{ whiteSpace: 'break-spaces', wordBreak: 'break-word', width: '95%', display: 'block'}}>{poll.subject}</span>}
      closable={true}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Tag
              color={getTagColor('category', poll.category)}
            >
              {poll.category || "uncategorized"}
            </Tag>
            {poll.status && (
              <Tag
                color={getTagColor('status', poll.status)}
              >
                {poll.status}
              </Tag>
            )}
          </div>
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

      <div className="space-y-6">
        {/* Poll Stats */}
        <div className="flex flex-row gap-2 overflow-x-auto pb-2">
          <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg min-w-[120px]">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Participants</p>
              <p className="font-semibold text-sm">
                <span>{poll.totalResponses} / {poll.maxResponses}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg min-w-[120px]">
            <Trophy className="h-4 w-4 text-primary" />
            <div>
              {poll.status === "for-funding" ?
                <>
                  <p className="text-xs text-muted-foreground">Target Fund</p>
                  <p className="font-semibold text-sm">
                    <span>{ethers.utils.formatEther(poll.funds || '0')} / {ethers.utils.formatEther(poll.targetFund || '0')} NERO </span>
                  </p>
                </>
              :
                <>
                  <p className="text-xs text-muted-foreground">Prize Pool</p>
                  <p className="font-semibold text-sm">
                    {ethers.utils.formatEther(poll.funds || '0')} NERO
                  </p>
                </>
              }
            </div>
          </div>
          <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg min-w-[120px]">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Time Left</p>
              <p className="font-semibold text-sm">
                {poll.endDate && calculateTimeLeft(poll.endDate)}
              </p>
            </div>
          </div>
        </div>

        {renderNotOpenMessage(poll)}
 
        <Separator />

        {/* Voting Section */}
        {poll.status === "open" &&
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

            {hasVoted || isPollEnded ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 mb-4">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    {isPollEnded ? 'Voting is closed. Here are the results:' : 'You have voted! Here are the current results:'}
                  </span>
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
                        {selectedOption === option.text && !isPollEnded && (
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
                {isPollEnded && (
                  <p className="text-center text-muted-foreground text-sm mt-4">
                    This poll has ended. You can no longer vote.
                  </p>
                )}
              </div>
            ) :
              <div className="space-y-4">
                <RadioGroup
                  value={selectedOption}
                  onValueChange={setSelectedOption}
                  disabled={isVoting || hasVoted || isPollEnded || poll.status !== "open" || !isConnected}
                >
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
                
                {/* Captcha Component */}
                {!isPollEnded && (
                  <div className="flex justify-center my-4">
                    <Captcha
                      ref={captchaRef}
                      onVerify={setCaptchaToken}
                      onExpire={() => setCaptchaToken(null)}
                      onError={() => setCaptchaToken(null)}
                      size="normal"
                      theme="light"
                    />
                  </div>
                )}
                
                {!isPollEnded && (
                  <Button onClick={handleOptionVote} disabled={isVoting} className="w-full text-white" size="lg">
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
                )}
              </div>
            }
          </div>
        }
        
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

        {poll.status === "for-funding" && (
          <div className="flex justify-end">
            <Button
              onClick={() => setIsFundingModalOpen(true)}
              className="text-white"
            >
              <CircleDollarSign className="h-4 w-4 mr-2" />
              Fund Poll
            </Button>
          </div>
        )}
      </div>

      {/* Funding Modal */}
      <Modal
        title={`Fund poll: ${poll.subject}`}
        open={isFundingModalOpen}
        maskClosable={false}
        onCancel={() => setIsFundingModalOpen(false)}
        footer={[
          <Button key="submit" className="text-white" disabled={isLoading}
            onClick={async () => {
              await handleFundPollLocal();
              setIsFundingModalOpen(false);
            }}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              'Yes'
            )}
          </Button>,
          <Button key="back" variant="outline" disabled={isLoading} onClick={() => {
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
          <Form.Item
            label="Fund"
            name="contribution"
            rules={[{ required: true, message: 'Please enter amount to contribute' }]}
            style={{ textAlign: 'center' }}
          >
            <InputNumber
              placeholder="Amount in NERO"
              min="0.001"
              step="0.001"
              addonAfter={selectAfter}
              stringMode
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  )
}
