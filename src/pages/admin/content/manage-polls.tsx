"use client"

import { VotePollModal } from "@/components/modals/vote-poll-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui_v2/avatar";
import { Badge } from "@/components/ui_v2/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui_v2/card";
import { WalletConnector } from "@/components/wallet/wallet-connector";
import { POLLS_DAPP_ABI, } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import { useSendUserOp, useSignature } from '@/hooks';
import ManagePoll from "@/pages/simple/manage-poll";
import { PollState } from "@/types/poll";
import { getCompressedAddress } from "@/utils/addressUtil";
import { computePercentage } from "@/utils/mathUtils";
import { calculateTimeLeft } from "@/utils/timeUtils";
import { Button, Form, InputNumber, Modal, Result, Select, Space } from 'antd';
import { ethers } from 'ethers';
import { CircleDollarSign, Clock, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { handleClaimRewards } from '@/utils/pollUtils';

interface ManagePollsProps {
  AAaddress: string
  polls: PollState[]
  fetchPolls: () => void
  handleTabChange: (tab: string) => void
  isWalletConnected: boolean
  setIsWalletConnected: (isWalletConnected: boolean) => void
}

export default function ManagePolls({ AAaddress, handleTabChange, polls, fetchPolls, isWalletConnected, setIsWalletConnected }: ManagePollsProps) {

  const { isConnected } = useSignature();

  // Filter polls based on their status
  const createdPolls = polls.filter(poll =>  {
    return poll.creator?.toLocaleLowerCase() === AAaddress.toLocaleLowerCase()
  });

  return (
    <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {createdPolls.map((poll) => (
              <PollCard
                key={poll.id} poll={poll} type="created" 
                fetchPolls={fetchPolls}
              />
            ))}
            {createdPolls.length === 0 && (
              <div className="col-span-3 text-center py-10">
                {isConnected ?
                  <>
                    <Result
                      status="404"
                      title="Oops!"
                      subTitle="You haven't created any polls yet."
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

function PollCard({ poll, type, fetchPolls, AAaddress, }: 
  { poll: PollState, type: string, fetchPolls: () => void, AAaddress?: string, }) {
  
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
  const [isVoting, setIsVoting] = useState(false);

  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isManagePollModalOpen, setIsManagePollModalOpen] = useState(false);
  const [isOpenPollModalOpen, setIsOpenPollModalOpen] = useState(false);
  const [isClosePollModalOpen, setIsClosePollModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isOpenForFundingModalOpen, setIsOpenForFundingModalOpen] = useState(false);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);

  const [selectedPoll, setSelectedPoll] = useState<any | null>(null)
  const [isPollModalOpen, setIsPollModalOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false);
  const isClaimed = poll.responsesWithAddress?.some(response => response.address === AAaddress && response.isClaimed);
  const [isForClaimingModalOpen, setIsForClaimingModalOpen] = useState(false);
  const [votedOption, setVotedOption] = useState<string | null>(null);

  const [form] = Form.useForm();

  // Initialize form with contribution value
  useEffect(() => {
    const funds = parseFloat(ethers.utils.formatEther(poll.funds || '0'));
    const targetFund = parseFloat(ethers.utils.formatEther(poll.targetFund || '0'));
    const remainingAmount = (targetFund - funds).toFixed(3);
    form.setFieldsValue({ contribution: remainingAmount });
  }, [poll.funds, poll.targetFund, form]);

  const handleViewPoll = (poll: any) => {
    setSelectedPoll(poll)
    setIsPollModalOpen(true)
  }

  const closePollModal = () => {
    setIsPollModalOpen(false)
    setSelectedPoll(null)
  }

  const handleOptionVote = async (option) => {
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
        abi: POLLS_DAPP_ABI, // Use the specific ABI with mint function
        params: [
          poll.id,
          option.text,
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
      setIsVoteModalOpen(false);
    }

  };

  const handleUpdatePoll = async (updatedPoll: any) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: 'updatePoll',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: POLLS_DAPP_ABI, // Use the specific ABI with mint function
        params: [
          updatedPoll.id,
          updatedPoll.subject,
          updatedPoll.description,
          ethers.utils.parseEther(updatedPoll.rewardPerResponse).toString(),
          parseInt(updatedPoll.duration),
          parseInt(updatedPoll.maxResponses),
          ethers.utils.parseEther(updatedPoll.minContribution).toString(),
          ethers.utils.parseEther(updatedPoll.targetFund).toString(),
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
      setIsLoading(false);
      setIsManagePollModalOpen(false);
    }
  };

  const handleOpenForClaiming = async (poll: PollState) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: 'forClaiming',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: POLLS_DAPP_ABI,
        params: [
          poll.id,
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
      setIsLoading(false);
      setIsForClaimingModalOpen(false);
    }
  };

  const handleOpenPoll = async (poll: PollState) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: 'openPoll',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: POLLS_DAPP_ABI,
        params: [
          poll.id,
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
      setIsLoading(false);
      setIsOpenPollModalOpen(false);
    }
  };

  const handleClosePoll = async (poll: PollState) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: 'closePoll',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: POLLS_DAPP_ABI,
        params: [
          poll.id,
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
      setIsLoading(false);
      setIsClosePollModalOpen(false)
    }
  };

  const handlePollStatusChange = async (poll: PollState, method: string) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      await execute({
        function: method,
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: POLLS_DAPP_ABI,
        params: [
          poll.id,
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
      setIsLoading(false);
    }
  };

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
      setIsClaimModalOpen
    );
  };

  const handleFundPollLocal = async (poll) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
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
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
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
  const isEnded = new Date() >= poll.endDate;
  const targetResponseCountReached = Number(poll.responses.length) >= Number(poll.maxResponses);
  const isVoted = poll.responsesWithAddress?.some(response => response.address === AAaddress);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{poll.subject}</CardTitle>
          <StatusBadge poll={poll} />
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
          <span>{ethers.utils.formatEther(poll.funds || '0')} / {ethers.utils.formatEther(poll.targetFund || '0')} NERO </span>
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
          <Space direction="horizontal" size="middle">
            {poll.status === "open" && type === "active" && 
              <Button
                // variant={type === "voted" ? "outline" : "default"} size="sm" className="text-white"
                block
                onClick={() => setIsVoteModalOpen(true)}
                type="primary"
              >
                Vote
              </Button>
            }
            {/* {(poll.status === "new" && type === "created") &&
              <Button block variant="outlined" size="small" type="primary"
                onClick={() => setIsManagePollModalOpen(true)}>
                Manage
              </Button>
            } */}
            {poll.status === "new" && type === "created" &&
              <Button block variant="outlined" size="small" type="primary" 
                onClick={() => setIsOpenForFundingModalOpen(true)}>
                  Open For Funding
              </Button>
            }
            {poll.status === "for-funding" && type === "created" &&
              <Button block variant="outlined" size="small" type="primary" 
                onClick={() => setIsOpenPollModalOpen(true)}
                disabled={!targetReached}
              >
                  Open For Voting
              </Button>
            }
            {type === "created" && poll.status === "open" &&
              <Button block variant="outlined" size="small" type="primary"
                onClick={() => setIsForClaimingModalOpen(true)}
                disabled={!(isEnded || targetResponseCountReached)}
              >
                  For Rewards Claim
              </Button>
            }
            {type === "created" && poll.status === "for-claiming" && 
              <>
                <Button
                  block variant="outlined" size="small"
                  type={isVoted ? "default" : "primary"}
                  onClick={() => handleViewPoll(poll)}
                >
                  View
                </Button>
                <Button block variant="outlined" size="small" type="primary"
                  onClick={() => setIsClosePollModalOpen(true)}>
                    Close Poll
                </Button>
              </>
            }
            {type === "voted" && poll.status === "for-claiming" &&
              <Button block variant="outlined" size="small" type="primary"
                disabled={isClaimed}
                onClick={() => setIsClaimModalOpen(true)}>
                  Claim
              </Button>
            }
            {(type === "created" || type === "funding") && poll.status === "for-funding" &&
              <Button block variant="outlined" size="small" type="primary"
                onClick={() => setIsFundingModalOpen(true)}
                disabled={targetReached}>
                {targetReached ? 'Target Reached' : 'Fund'}
              </Button>
            }
          </Space>
        </div>
      </CardFooter>
      <Modal
        title={poll.subject}
        open={isVoteModalOpen}
        onCancel={() => setIsVoteModalOpen(false)}
        footer={null}
        maskClosable={false}
      >
        <Space direction="vertical" size="middle">
        {modOptions.map((option, index) => (
          <Button
            key={index} block onClick={() => handleOptionVote(option)}
            loading={isVoting}
            disabled={type === "voted"}
            type={votedOption === option.text ? "primary" : "default"}
          >
            {option.text}
          </Button>
        ))}
        </Space>
      </Modal>
      <Modal
        title={poll.subject}
        open={isManagePollModalOpen}
        footer={null}
        onCancel={() => setIsManagePollModalOpen(false)}
      >
        <ManagePoll poll={poll} handleUpdatePoll={handleUpdatePoll} />
      </Modal>
      <Modal
        title={"Close Poll: " + poll.subject}
        open={isClosePollModalOpen}
        maskClosable={false}
        onCancel={() => setIsClosePollModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={async () => {
              await handleClosePoll(poll);
              setIsClosePollModalOpen(false);
            }}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" loading={isLoading} onClick={() => {
            setIsClosePollModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
      </Modal>
      <Modal
        title={"Open Poll: " + poll.subject}
        open={isOpenPollModalOpen}
        maskClosable={false}
        onCancel={() => setIsOpenPollModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={() => {
              handleOpenPoll(poll);
            }}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" loading={isLoading} onClick={() => {
            setIsOpenPollModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
      </Modal>
      <Modal
        title={"Start Claims for: " + poll.subject}
        open={isForClaimingModalOpen}
        maskClosable={false}
        onCancel={() => setIsForClaimingModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={() => {
              handleOpenForClaiming(poll);
            }}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" onClick={() => {
            setIsForClaimingModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
      </Modal>
      <Modal
        title={"Claim Rewards for poll: " + poll.subject}
        open={isClaimModalOpen}
        maskClosable={false}
        onCancel={() => setIsClaimModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={onClaimRewards}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" loading={isLoading} onClick={() => {
            setIsClaimModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
      </Modal>

      <Modal
        title={"Open poll for funding: " + poll.subject}
        open={isOpenForFundingModalOpen}
        maskClosable={false}
        onCancel={() => setIsOpenForFundingModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={async () => {
              await handlePollStatusChange(poll, "forFunding");
              setIsOpenForFundingModalOpen(false);
            }}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" loading={isLoading} onClick={() => {
            setIsOpenForFundingModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
      </Modal>

      <Modal
        title={"Close Poll: " + poll.subject}
        open={isClosePollModalOpen}
        maskClosable={false}
        onCancel={() => setIsClosePollModalOpen(false)}
        footer={[
          <Button key="submit" type="primary" loading={isLoading}
            onClick={async () => {
              await handleClosePoll(poll);
            }}>
            Yes
          </Button>,
          <Button key="back" variant="outlined" loading={isLoading} onClick={() => {
            setIsClosePollModalOpen(false);
          }}>
            No
          </Button>,
        ]}
      >
      </Modal>

      <Modal
        title={"Fund poll: " + poll.subject}
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
      <VotePollModal
        featureFlagNew={true} 
        poll={selectedPoll} isOpen={isPollModalOpen} onClose={closePollModal}
        fetchPolls={fetchPolls}
      />
    </Card>
  )
}

interface StatusBadgeProps {
  poll: {
    status: string;
    funds: number;
    targetFund: number;
  };
}

function StatusBadge({ poll }: StatusBadgeProps) {
  const { status } = poll;

  const funds = parseFloat(ethers.utils.formatEther(poll.funds || '0'));
  const targetFund = parseFloat(ethers.utils.formatEther(poll.targetFund || '0'));
  const isTargetReached = funds >= targetFund;

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
        {isTargetReached ? "Target Reached" : "Funding"}
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