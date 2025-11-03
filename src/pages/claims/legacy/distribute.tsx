"use client"

import { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback } from "@/components/ui_v2/avatar";
import { Badge } from "@/components/ui_v2/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v2/card";
import { Alert, AlertDescription } from "@/components/ui_v3/alert";
import { useSendUserOp, useSignature, useConfig } from '@/hooks';
import { PollState } from "@/types/poll";
import { getCompressedAddress } from "@/utils/addressUtil";
import { Button, Table, Input, Modal, Statistic } from 'antd';
import { ethers } from 'ethers';
import { AlertTriangle, Download, Users, CircleDollarSign, CheckCircle } from "lucide-react";
import { POLLS_DAPP_LEGACY_ABI } from '@/constants/abi';
import { convertTimestampToDate } from '@/utils/format';
import LandingPageHeader from "@/pages/landing/landing-header";
import { flattenPollResponses, formatReward, ResponseRecord } from '@/utils/rewardCalculator';
import { useToast } from "@/components/ui_v3/use-toast";

const DISTRIBUTED_KEY = 'legacy_distributed_rewards';

export default function LegacyDistributePage() {
  const { AAaddress, isConnected } = useSignature();
  const config = useConfig();
  const { toast } = useToast();
  const { execute, waitForUserOpResult } = useSendUserOp();

  const [polls, setPolls] = useState<PollState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [distributedRecords, setDistributedRecords] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ResponseRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    if (isConnected && AAaddress) {
      fetchLegacyPolls();
      loadDistributedRecords();
    }
  }, [isConnected, AAaddress, config]);

  const loadDistributedRecords = () => {
    try {
      const stored = localStorage.getItem(DISTRIBUTED_KEY);
      if (stored) {
        setDistributedRecords(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Error loading distributed records:', error);
    }
  };

  const saveDistributedRecord = (recordKey: string) => {
    const updated = new Set(distributedRecords);
    updated.add(recordKey);
    setDistributedRecords(updated);
    localStorage.setItem(DISTRIBUTED_KEY, JSON.stringify(Array.from(updated)));
  };

  const getRecordKey = (record: ResponseRecord) => {
    return `${record.pollId}-${record.responderAddress}-${record.responseIndex}`;
  };

  const fetchLegacyPolls = async () => {
    const legacyContractAddress = import.meta.env.VITE_LEGACY_DPOLLS_CONTRACT_ADDRESS;

    if (!legacyContractAddress) {
      console.error('Legacy contract address not configured');
      return;
    }

    try {
      setIsLoading(true);

      const rpcUrl = config.chains[config.currentNetworkIndex].chain.rpc;
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      const pollsContract = new ethers.Contract(
        legacyContractAddress,
        POLLS_DAPP_LEGACY_ABI,
        provider
      );

      const allPollIds = await pollsContract.getAllPollIds();

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
            } catch (error: any) {
              // Log error but continue processing other polls
              console.warn(`Skipping poll ${pollId} due to error:`, error.message || error);
              return null;
            }
          })
        );

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

  const responseRecords = useMemo(() => {
    return flattenPollResponses(polls);
  }, [polls]);

  const filteredRecords = useMemo(() => {
    return responseRecords.filter(record => {
      const matchesSearch = searchText === '' ||
        record.responderAddress.toLowerCase().includes(searchText.toLowerCase()) ||
        record.pollSubject.toLowerCase().includes(searchText.toLowerCase()) ||
        record.pollId.toString().includes(searchText);

      return matchesSearch;
    });
  }, [responseRecords, searchText]);

  const stats = useMemo(() => {
    const totalRecords = responseRecords.length;
    const unclaimedRecords = responseRecords.filter(r => !r.isClaimed);
    const distributedCount = responseRecords.filter(r => distributedRecords.has(getRecordKey(r))).length;

    const totalRewards = responseRecords.reduce((sum, r) => {
      return sum.add(r.rewardAmount);
    }, ethers.BigNumber.from(0));

    const unclaimedRewards = unclaimedRecords.reduce((sum, r) => {
      return sum.add(r.rewardAmount);
    }, ethers.BigNumber.from(0));

    const uniqueResponders = new Set(responseRecords.map(r => r.responderAddress)).size;

    return {
      totalRecords,
      unclaimedRecords: unclaimedRecords.length,
      distributedCount,
      totalRewards: formatReward(totalRewards),
      unclaimedRewards: formatReward(unclaimedRewards),
      uniqueResponders,
    };
  }, [responseRecords, distributedRecords]);

  const handleDistribute = async (record: ResponseRecord) => {
    if (!isConnected) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive"
      });
      return;
    }

    setIsDistributing(true);
    try {
      // Send native NERO to the responder
      await execute({
        function: 'execute', // Standard AA execute function for native transfer
        contractAddress: record.responderAddress,
        abi: [], // No ABI needed for native transfer
        params: [],
        value: record.rewardAmount.toString(),
      });

      const result = await waitForUserOpResult();

      if (result.result === true) {
        toast({
          title: "Success",
          description: `Distributed ${record.rewardAmountFormatted} to ${getCompressedAddress(record.responderAddress)}`,
        });

        // Mark as distributed
        saveDistributedRecord(getRecordKey(record));
        setIsModalOpen(false);
      } else {
        toast({
          title: "Transaction Failed",
          description: result.error || "Failed to distribute reward",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to distribute reward",
        variant: "destructive"
      });
    } finally {
      setIsDistributing(false);
    }
  };

  const exportToCSV = () => {
    const csvData = filteredRecords.map(record => ({
      'Responder Address': record.responderAddress,
      'Poll ID': record.pollId,
      'Poll Subject': record.pollSubject,
      'Poll Status': record.pollStatus,
      'Reward Amount (NERO)': ethers.utils.formatEther(record.rewardAmount),
      'Claimed': record.isClaimed ? 'Yes' : 'No',
      'Distributed': distributedRecords.has(getRecordKey(record)) ? 'Yes' : 'No',
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legacy-distribution-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: 'Responder',
      dataIndex: 'responderAddress',
      key: 'responder',
      render: (address: string) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">{address.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="font-mono text-sm">{getCompressedAddress(address)}</span>
        </div>
      ),
      width: 180,
    },
    {
      title: 'Poll ID',
      dataIndex: 'pollId',
      key: 'pollId',
      width: 80,
      sorter: (a: ResponseRecord, b: ResponseRecord) => a.pollId - b.pollId,
    },
    {
      title: 'Poll Subject',
      dataIndex: 'pollSubject',
      key: 'pollSubject',
      render: (subject: string) => (
        <span className="truncate max-w-xs block" title={subject}>{subject}</span>
      ),
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'pollStatus',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Badge variant="secondary" className="text-xs">{status}</Badge>
      ),
    },
    {
      title: 'Reward',
      dataIndex: 'rewardAmountFormatted',
      key: 'reward',
      width: 150,
      sorter: (a: ResponseRecord, b: ResponseRecord) => {
        return a.rewardAmount.gt(b.rewardAmount) ? 1 : -1;
      },
    },
    {
      title: 'Claim Status',
      key: 'claimStatus',
      width: 120,
      render: (_: any, record: ResponseRecord) => {
        const isDistributed = distributedRecords.has(getRecordKey(record));
        if (record.isClaimed) {
          return <Badge variant="default" className="text-xs"><CheckCircle className="h-3 w-3 mr-1" />Claimed</Badge>;
        }
        if (isDistributed) {
          return <Badge variant="default" className="text-xs bg-blue-500"><CheckCircle className="h-3 w-3 mr-1" />Distributed</Badge>;
        }
        return <Badge variant="outline" className="text-xs">Unclaimed</Badge>;
      },
      filters: [
        { text: 'Claimed', value: 'claimed' },
        { text: 'Distributed', value: 'distributed' },
        { text: 'Unclaimed', value: 'unclaimed' },
      ],
      onFilter: (value: any, record: ResponseRecord) => {
        const isDistributed = distributedRecords.has(getRecordKey(record));
        if (value === 'claimed') return record.isClaimed;
        if (value === 'distributed') return isDistributed;
        if (value === 'unclaimed') return !record.isClaimed && !isDistributed;
        return true;
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      render: (_: any, record: ResponseRecord) => {
        const isDistributed = distributedRecords.has(getRecordKey(record));
        const disabled = record.isClaimed || isDistributed;

        return (
          <Button
            type="primary"
            size="small"
            disabled={disabled}
            onClick={() => {
              setSelectedRecord(record);
              setIsModalOpen(true);
            }}
          >
            {record.isClaimed ? 'Claimed' : isDistributed ? 'Distributed' : 'Distribute'}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingPageHeader />

      <div className="container mx-auto px-4 py-8">
        <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950">
          <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Distribution Tool:</strong> This page allows you to manually distribute rewards to responders from the legacy contract.
            Click "Distribute" for each responder to send their rewards directly from your wallet.
          </AlertDescription>
        </Alert>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Reward Distribution</h1>
          <p className="text-muted-foreground">
            Distribute rewards to legacy poll responders manually
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Responses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Statistic value={stats.totalRecords} />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.uniqueResponders} unique responders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Unclaimed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Statistic value={stats.unclaimedRecords} />
              <p className="text-xs text-muted-foreground mt-1">
                Need distribution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Distributed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Statistic value={stats.distributedCount} />
              <p className="text-xs text-muted-foreground mt-1">
                Already sent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4" />
                Total Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalRewards}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Unclaimed: {stats.unclaimedRewards}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table Controls */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Response Records</CardTitle>
                <CardDescription>One row per poll response with reward amounts</CardDescription>
              </div>
              <Button
                icon={<Download className="h-4 w-4" />}
                onClick={exportToCSV}
              >
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search by address, poll ID, or subject..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="max-w-md"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading response records...</p>
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={filteredRecords}
                rowKey={(record) => getRecordKey(record)}
                pagination={{
                  pageSize: pageSize,
                  showTotal: (total) => `Total ${total} responses`,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  onChange: (page, newPageSize) => {
                    setPageSize(newPageSize);
                  },
                }}
                scroll={{ x: 'max-content' }}
              />
            )}
          </CardContent>
        </Card>

        {/* Distribution Modal */}
        <Modal
          title="Confirm Distribution"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>,
            <Button
              key="distribute"
              type="primary"
              loading={isDistributing}
              onClick={() => selectedRecord && handleDistribute(selectedRecord)}
            >
              Distribute Now
            </Button>,
          ]}
        >
          {selectedRecord && (
            <div className="py-4 space-y-4">
              <p>Are you sure you want to distribute the reward for this response?</p>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Responder:</span>
                  <span className="text-sm font-mono">{getCompressedAddress(selectedRecord.responderAddress)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Poll ID:</span>
                  <span className="text-sm font-semibold">#{selectedRecord.pollId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Poll:</span>
                  <span className="text-sm truncate max-w-xs">{selectedRecord.pollSubject}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm font-semibold">Reward Amount:</span>
                  <span className="text-lg font-bold text-primary">{selectedRecord.rewardAmountFormatted}</span>
                </div>
              </div>

              <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
                  This will send NERO from your wallet to the responder's address. This action cannot be undone.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
