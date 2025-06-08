"use client"

import { useState } from "react"
import { useSignature, useSendUserOp, useConfig, useEthersSigner } from '@/hooks';
import { POLLS_DAPP_ABI,  } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui_v2/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_v2/tabs"
import { Badge } from "@/components/ui_v2/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui_v2/avatar"
import { PlusCircle, Clock, Users, CircleDollarSign } from "lucide-react"
import { Button, Form, Modal, Space, Input } from 'antd';
import ManagePoll from "@/pages/simple/manage-poll";
import { PollState } from "@/types/poll";
import { ethers } from 'ethers';
import { getSigner, fundPoll } from '@/utils/aaUtils';
import { calculateTimeLeft } from "@/utils/timeUtils";
import { computePercentage } from "@/utils/mathUtils";
import { handleClaimRewards } from '@/utils/pollUtils';

const NERO_POLL_ABI = [
  // Basic ERC721 functions from the standard ABI
  ...POLLS_DAPP_ABI,
  // Add the mint function that exists in the NeroNFT contract
  'function mint(address to, string memory uri) returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string memory)',
];

export default function Dashboard({ AAaddress, handleTabChange, polls, fetchPolls, activeDashboardTab }: 
  { AAaddress: string, handleTabChange: (tab: string) => void, polls: PollState[], fetchPolls: () => void, activeDashboardTab: string }) {
  const [activeTab, setActiveTab] = useState(activeDashboardTab || "active");
  const config = useConfig(); // Get config to access RPC URL

  // Filter polls based on their status
  const activePolls = polls.filter(poll => poll.isOpen && (poll.status === "open" || poll.status === "new" || poll.status === "for-claiming"))
  const createdPolls = polls.filter(poll => poll.creator === AAaddress)
  const votedPolls = polls.filter(poll => poll.responsesWithAddress?.some(response => response.address === AAaddress)) // Assuming there's a voted flag
  const fundingPolls = polls.filter(poll => poll.status === "for-funding")

  const handleFundPoll = async (poll: any, amount: any) => {
    console.log("poll", poll);
    console.log("amount", amount);

    const ethAmount = ethers.utils.parseEther(amount);

    // Get signer from browser wallet
    const signer = await getSigner();
    const result = await fundPoll(signer, poll.id, ethAmount);
    console.log('result', result)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outlined" className="gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Connected: {AAaddress ? AAaddress.slice(0, 6) + "..." + AAaddress.slice(-4) : "Not Connected"}
          </Button>
          <Button className="gap-2" onClick={() => handleTabChange('create-poll')}>
            <PlusCircle className="h-4 w-4" />
            Create Poll
          </Button>
        </div>
      </div>

      <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md mb-8">
          <TabsTrigger value="active">Active Polls</TabsTrigger>
          <TabsTrigger value="created">My Polls</TabsTrigger>
          <TabsTrigger value="voted">Voted</TabsTrigger>
          <TabsTrigger value="funding">Funding</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePolls.map((poll) => (
              <PollCard
                key={poll.id} poll={poll} type="active"
                fetchPolls={fetchPolls}
                handleTabChange={handleTabChange}
              />
            ))}
            {activePolls.length === 0 && (
              <div className="col-span-3 text-center py-10">
                <p className="text-gray-500">No active polls found</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="created" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {createdPolls.map((poll) => (
              <PollCard
                key={poll.id} poll={poll} type="created" 
                fetchPolls={fetchPolls}
                handleTabChange={() => handleTabChange('create-poll')}
              />
            ))}
            {createdPolls.length === 0 && (
              <div className="col-span-3 text-center py-10">
                <p className="text-gray-500">You haven't created any polls yet</p>
                <Button className="mt-4" onClick={() => handleTabChange('create-poll')}>
                  Create Your First Poll
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="voted" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {votedPolls.map((poll) => (
              <PollCard 
                key={poll.id} poll={poll} type="voted" 
                fetchPolls={fetchPolls}
                AAaddress={AAaddress}
              />
            ))}
            {votedPolls.length === 0 && (
              <div className="col-span-3 text-center py-10">
                <p className="text-gray-500">You haven't voted on any polls yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="funding" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fundingPolls.map((poll) => (
              <PollCard 
                key={poll.id} poll={poll} type="funding" 
                fetchPolls={fetchPolls}
                AAaddress={AAaddress}
                handleFundPoll={(poll, amount) => handleFundPoll(poll, amount)}
              />
            ))}
            {fundingPolls.length === 0 && (
              <div className="col-span-3 text-center py-10">
                <p className="text-gray-500">No polls are currently open for funding</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PollCard({ poll, type, fetchPolls, handleTabChange, AAaddress, handleFundPoll }: 
  { poll: any, type: string, fetchPolls: () => void, handleTabChange?: (tab: string) => void, AAaddress?: string, handleFundPoll?: (poll: any, amount: any) => void, }) {
  
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

  const [isLoading, setIsLoading] = useState(false);
  const isClaimed = poll.responsesWithAddress?.some((response: { address: string; isClaimed: boolean }) => response.address === AAaddress && response.isClaimed);
  const [isForClaimingModalOpen, setIsForClaimingModalOpen] = useState(false);
  const [votedOption, setVotedOption] = useState<string | null>(null);

  const [form] = Form.useForm();

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
        abi: NERO_POLL_ABI, // Use the specific ABI with mint function
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
        abi: NERO_POLL_ABI, // Use the specific ABI with mint function
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
        abi: NERO_POLL_ABI,
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
        abi: NERO_POLL_ABI,
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
        abi: NERO_POLL_ABI,
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
        abi: NERO_POLL_ABI,
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
        abi: NERO_POLL_ABI, // Use the specific ABI with mint function
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
  }

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

  const modOptions = poll.options.map((option: string, index: number) => {
    return { text: option, percentage: computePercentage(poll.responses, index.toString()) };
  });

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
          {type === "created" &&
            <>
              <CircleDollarSign className="h-4 w-4" />
              <span>{ethers.utils.formatEther(poll.funds || '0')} NERO </span>
            </>
          }
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
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`/placeholder.svg?height=24&width=24`} alt="Creator" />
            <AvatarFallback>{poll.creator.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{poll.creator}</span>
        </div>
        <div className="flex flex-col gap-2">
          {/* <Button
            // variant={type === "voted" ? "outline" : "default"} size="sm" className="text-white"
            block
            onClick={(e) => {
              console.log('e target', e.target)
              if (type === "active") {
                showModal();
              } else if (type === "voted") {
                const votedOption = poll.responsesWithAddress?.find(response => response.address === AAaddress)?.response;
                console.log("votedOption", votedOption);
                setVotedOption(votedOption);
                showModal();
              }
            }}
            disabled={type === "voted" && isClaimed}
          >
            {(poll.status === "open" && type === "voted") && "View"}
            {poll.status === "closed" && "View"}
          </Button> */}
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
          {(poll.status === "new" && type === "created") &&
            <Button block variant="outlined" size="small" type="primary"
              onClick={() => setIsManagePollModalOpen(true)}>
              Manage
            </Button>
          }
          {poll.status === "new" && type === "created" &&
            <Button block variant="outlined" size="small" type="primary" 
              onClick={() => setIsOpenForFundingModalOpen(true)}>
                Open For Funding
            </Button>
          }
          {poll.status === "for-funding" && type === "created" &&
            <Button block variant="outlined" size="small" type="primary" 
              onClick={() => setIsOpenPollModalOpen(true)}>
                Open For Voting
            </Button>
          }
          {type === "created" && poll.status === "open" &&
            <Button block variant="outlined" size="small" type="primary"
              onClick={() => setIsForClaimingModalOpen(true)}>
                For Rewards Claim
            </Button>
          }
          {type === "created" && poll.status === "for-claiming" && 
            <Button block variant="outlined" size="small" type="primary"
              onClick={() => setIsClosePollModalOpen(true)}>
                Close Poll
            </Button>
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
              onClick={() => setIsFundingModalOpen(true)}>
                Fund
            </Button>
          }
        </div>
      </CardFooter>
      <Modal
        title={poll.subject || poll.title || poll.question}
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
        title={poll.subject || poll.title || poll.question}
        open={isManagePollModalOpen}
        footer={null}
        onCancel={() => setIsManagePollModalOpen(false)}
      >
        <ManagePoll poll={poll} handleUpdatePoll={handleUpdatePoll} />
      </Modal>
      <Modal
        title={"Close Poll: " + poll.subject || poll.title || poll.question}
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
        title={"Open Poll: " + poll.subject || poll.title || poll.question}
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
        title={"Start Claims for: " + poll.subject || poll.title || poll.question}
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
        title={"Claim Rewards for poll: " + poll.subject || poll.title || poll.question}
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
        title={"Open poll for funding: " + poll.subject || poll.title || poll.question}
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
        title={"Close Poll: " + poll.subject || poll.title || poll.question}
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
            <Input placeholder="Amount in ETH" />
          </Form.Item>
        </Form>
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