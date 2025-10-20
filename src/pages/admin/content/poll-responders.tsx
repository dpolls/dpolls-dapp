"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui_v2/avatar";
import { Badge } from "@/components/ui_v2/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui_v2/card";
import { WalletConnector } from "@/components/wallet/wallet-connector";
import { useSignature } from '@/hooks';
import { PollState } from "@/types/poll";
import { getCompressedAddress } from "@/utils/addressUtil";
import { Button, Result, Table, Input, Select } from 'antd';
import { ethers } from 'ethers';
import { Users, CheckCircle, Clock, Search, Download } from "lucide-react";
import { useState, useMemo } from "react";

interface PollRespondersProps {
  AAaddress: string
  polls: PollState[]
  fetchPolls: () => void
  handleTabChange: (tab: string) => void
  isWalletConnected: boolean
  setIsWalletConnected: (isWalletConnected: boolean) => void
}

export default function PollResponders({
  AAaddress,
  polls,
  fetchPolls,
  handleTabChange,
  isWalletConnected,
  setIsWalletConnected
}: PollRespondersProps) {
  const { isConnected } = useSignature();
  const [selectedPollId, setSelectedPollId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");

  // Filter polls created by the current user
  const createdPolls = polls.filter(poll =>
    poll.creator?.toLowerCase() === AAaddress.toLowerCase()
  );

  // Calculate statistics
  const totalStats = useMemo(() => {
    const stats = {
      totalPolls: createdPolls.length,
      totalResponses: 0,
      claimedResponses: 0,
      unclaimedResponses: 0,
      totalRewardsPaid: 0,
      totalRewardsPending: 0
    };

    createdPolls.forEach(poll => {
      if (poll.responsesWithAddress) {
        stats.totalResponses += poll.responsesWithAddress.length;
        poll.responsesWithAddress.forEach(response => {
          if (response.isClaimed) {
            stats.claimedResponses++;
            stats.totalRewardsPaid += Number(ethers.utils.formatEther(response.reward || 0));
          } else {
            stats.unclaimedResponses++;
            stats.totalRewardsPending += Number(ethers.utils.formatEther(response.reward || 0));
          }
        });
      }
    });

    return stats;
  }, [createdPolls]);

  // Get selected poll or show all
  const displayPolls = selectedPollId !== null
    ? createdPolls.filter(poll => poll.id === selectedPollId)
    : createdPolls;

  // Prepare data for table
  const tableData = useMemo(() => {
    const data: any[] = [];
    displayPolls.forEach(poll => {
      if (poll.responsesWithAddress) {
        poll.responsesWithAddress.forEach((response, index) => {
          if (searchText === "" ||
              response.address.toLowerCase().includes(searchText.toLowerCase()) ||
              response.response.toLowerCase().includes(searchText.toLowerCase())) {
            data.push({
              key: `${poll.id}-${index}`,
              pollId: poll.id,
              pollSubject: poll.subject,
              address: response.address,
              response: response.response,
              weight: response.weight,
              timestamp: response.timestamp,
              reward: response.reward,
              isClaimed: response.isClaimed
            });
          }
        });
      }
    });
    return data;
  }, [displayPolls, searchText]);

  const columns = [
    {
      title: 'Poll',
      dataIndex: 'pollSubject',
      key: 'pollSubject',
      render: (text: string, record: any) => (
        <div className="max-w-xs truncate">
          <span className="font-medium text-sm">{text}</span>
          <br />
          <span className="text-xs text-gray-500">Poll #{record.pollId}</span>
        </div>
      ),
    },
    {
      title: 'Responder',
      dataIndex: 'address',
      key: 'address',
      render: (address: string) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`/placeholder.svg?height=24&width=24`} alt="Responder" />
            <AvatarFallback>{address.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="font-mono text-sm">{getCompressedAddress(address)}</span>
        </div>
      ),
    },
    {
      title: 'Response',
      dataIndex: 'response',
      key: 'response',
      render: (text: string) => (
        <span className="text-sm max-w-xs truncate block">{text}</span>
      ),
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight: number) => <span className="text-sm">{weight}</span>,
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date: Date) => (
        <span className="text-sm text-gray-600">
          {date ? new Date(date).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      title: 'Reward',
      dataIndex: 'reward',
      key: 'reward',
      render: (reward: any) => (
        <span className="text-sm font-medium">
          {ethers.utils.formatEther(reward || 0)} NERO
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isClaimed',
      key: 'isClaimed',
      render: (isClaimed: boolean) => (
        <Badge
          variant={isClaimed ? "default" : "secondary"}
          className={isClaimed ? "bg-green-500" : "bg-yellow-500"}
        >
          {isClaimed ? (
            <><CheckCircle className="h-3 w-3 mr-1 inline" /> Claimed</>
          ) : (
            <><Clock className="h-3 w-3 mr-1 inline" /> Unclaimed</>
          )}
        </Badge>
      ),
    },
  ];

  const exportToCSV = () => {
    const csvData = tableData.map(row => ({
      'Poll ID': row.pollId,
      'Poll Subject': row.pollSubject,
      'Responder Address': row.address,
      'Response': row.response,
      'Weight': row.weight,
      'Timestamp': row.timestamp ? new Date(row.timestamp).toISOString() : '',
      'Reward (NERO)': ethers.utils.formatEther(row.reward || 0),
      'Status': row.isClaimed ? 'Claimed' : 'Unclaimed'
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poll-responders-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <WalletConnector isWalletConnected={isWalletConnected} setIsWalletConnected={setIsWalletConnected} />
      </div>
    );
  }

  if (createdPolls.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-10">
          <Result
            status="404"
            title="No Polls Created"
            subTitle="You haven't created any polls yet. Create a poll to see responders here."
          />
          <Button className="mt-4" type="primary" onClick={() => handleTabChange('create-poll')}>
            Create Your First Poll
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Poll Responders</h1>
        <p className="text-gray-600">View all responders to your polls and track reward claims</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Polls</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalStats.totalPolls}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalStats.totalResponses}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Claimed Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{totalStats.claimedResponses}</p>
            <p className="text-sm text-gray-500">{totalStats.totalRewardsPaid.toFixed(4)} NERO</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{totalStats.unclaimedResponses}</p>
            <p className="text-sm text-gray-500">{totalStats.totalRewardsPending.toFixed(4)} NERO</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by address or response..."
                prefix={<Search className="h-4 w-4 text-gray-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                className="w-full"
                placeholder="Filter by poll"
                value={selectedPollId}
                onChange={setSelectedPollId}
                allowClear
                options={[
                  { value: null, label: 'All Polls' },
                  ...createdPolls.map(poll => ({
                    value: poll.id,
                    label: `#${poll.id} - ${poll.subject}`
                  }))
                ]}
              />
            </div>
            <Button
              type="primary"
              icon={<Download className="h-4 w-4" />}
              onClick={exportToCSV}
              disabled={tableData.length === 0}
            >
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Responders Table */}
      <Card>
        <CardContent className="pt-6">
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} responses`
            }}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: searchText ? 'No responses match your search' : 'No responses yet'
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
