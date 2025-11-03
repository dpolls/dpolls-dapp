"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui_v3/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v3/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_v3/tabs"
import { Input } from "@/components/ui_v3/input"
import { Label } from "@/components/ui_v3/label"
import { Badge } from "@/components/ui_v3/badge"
import { Alert, AlertDescription } from "@/components/ui_v3/alert"
import { useToast } from "@/components/ui_v3/use-toast"
import { Table, Modal, Select, Result } from 'antd'
import { Shield, AlertTriangle, Pause, Play, Download, DollarSign, Users, BarChart3, Folder } from "lucide-react"
import { ethers } from 'ethers'
import { POLLS_DAPP_ABI } from '@/constants/abi'
import { useConfig, useSignature, useSendUserOp } from '@/hooks'
import { PollState } from "@/types/poll"
import { isContractOwner, isContractOwnerWithEOA, getEOAAddress, isContractPaused, formatAdminActionResult } from '@/utils/adminUtils'
import { getCompressedAddress } from "@/utils/addressUtil"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui_v2/avatar"
import { convertTimestampToDate } from '@/utils/format'
import { fetchPollWithFallback } from '@/utils/pollFetcher'

interface SuperAdminProps {
  AAaddress: string
  polls: PollState[]
  fetchPolls: () => void
}

export default function SuperAdmin({ AAaddress, polls, fetchPolls }: SuperAdminProps) {
  const { toast } = useToast()
  const config = useConfig()
  const { isConnected } = useSignature()
  const { execute, waitForUserOpResult } = useSendUserOp()

  const [isOwner, setIsOwner] = useState(false)
  const [ownerType, setOwnerType] = useState<'aa' | 'eoa' | null>(null)
  const [eoaAddress, setEoaAddress] = useState<string | null>(null)
  const [contractOwner, setContractOwner] = useState<string | null>(null)
  const [isCheckingOwner, setIsCheckingOwner] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [communityFundBalance, setCommunityFundBalance] = useState("0")
  const [legacyPolls, setLegacyPolls] = useState<PollState[]>([])
  const [isLoadingLegacy, setIsLoadingLegacy] = useState(false)

  // Emergency action modals
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isStatusOverrideModalOpen, setIsStatusOverrideModalOpen] = useState(false)

  // Emergency action fields
  const [withdrawToken, setWithdrawToken] = useState("0x0000000000000000000000000000000000000000")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawRecipient, setWithdrawRecipient] = useState("")
  const [overridePollId, setOverridePollId] = useState("")
  const [overrideStatus, setOverrideStatus] = useState("closed")

  // Filters
  const [pollSearchText, setPollSearchText] = useState("")
  const [pollStatusFilter, setPollStatusFilter] = useState<string | null>(null)
  const [pollProjectFilter, setPollProjectFilter] = useState<string | null>(null)

  useEffect(() => {
    checkOwnership()
    fetchProjects()
    fetchCommunityFund()
    checkPausedStatus()
    fetchLegacyPolls()
  }, [AAaddress, isConnected])

  const checkOwnership = async () => {
    if (!AAaddress || !config?.chains[config?.currentNetworkIndex]?.dpolls?.contractAddress) {
      setIsOwner(false)
      setIsCheckingOwner(false)
      return
    }

    setIsCheckingOwner(true)

    // Get EOA address from MetaMask
    const eoa = await getEOAAddress()
    setEoaAddress(eoa)

    // Check if either AA or EOA is the owner
    const { isOwner: ownerCheck, ownerType: type, contractOwner: owner } = await isContractOwnerWithEOA(
      config.chains[config.currentNetworkIndex].dpolls.contractAddress,
      AAaddress,
      eoa,
      config.chains[config.currentNetworkIndex].chain.rpc
    )

    setIsOwner(ownerCheck)
    setOwnerType(type)
    setContractOwner(owner)
    setIsCheckingOwner(false)
  }

  const checkPausedStatus = async () => {
    if (!config?.chains[config?.currentNetworkIndex]?.dpolls?.contractAddress) return

    const pausedStatus = await isContractPaused(
      config.chains[config.currentNetworkIndex].dpolls.contractAddress,
      config.chains[config.currentNetworkIndex].chain.rpc
    )
    setIsPaused(pausedStatus)
  }

  const fetchProjects = async () => {
    if (!config?.chains[config?.currentNetworkIndex]?.dpolls?.contractAddress) return

    try {
      const provider = new ethers.providers.JsonRpcProvider(config.chains[config.currentNetworkIndex].chain.rpc)
      const pollsContract = new ethers.Contract(
        config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        POLLS_DAPP_ABI,
        provider
      )

      const allProjectIds = await pollsContract.getAllProjects()

      const fetchedProjects = await Promise.all(
        allProjectIds.map(async (projectId: string) => {
          const projectOwner = await pollsContract.getProjectOwner(projectId)
          const [totalPolls, activePolls, totalFunding] = await pollsContract.getProjectStats(projectId)

          return {
            id: projectId,
            name: projectId,
            owner: projectOwner,
            totalPolls: totalPolls.toNumber(),
            activePolls: activePolls.toNumber(),
            totalFunding: ethers.utils.formatEther(totalFunding)
          }
        })
      )

      setProjects(fetchedProjects)
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchCommunityFund = async () => {
    if (!config?.chains[config?.currentNetworkIndex]?.dpolls?.contractAddress) return

    try {
      const provider = new ethers.providers.JsonRpcProvider(config.chains[config.currentNetworkIndex].chain.rpc)
      const pollsContract = new ethers.Contract(
        config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        POLLS_DAPP_ABI,
        provider
      )

      // Check balance for native token (address(0))
      const balance = await pollsContract.getCommunityFundBalance("0x0000000000000000000000000000000000000000")
      setCommunityFundBalance(ethers.utils.formatEther(balance))
    } catch (error) {
      console.error('Error fetching community fund:', error)
    }
  }

  const fetchLegacyPolls = async () => {
    const legacyContractAddress = import.meta.env.VITE_LEGACY_DPOLLS_CONTRACT_ADDRESS

    if (!legacyContractAddress || !config?.chains[config?.currentNetworkIndex]?.chain?.rpc) return

    try {
      setIsLoadingLegacy(true)

      const provider = new ethers.providers.JsonRpcProvider(config.chains[config.currentNetworkIndex].chain.rpc)
      const pollsContract = new ethers.Contract(
        legacyContractAddress,
        POLLS_DAPP_ABI,
        provider
      )

      const allPollIds = await pollsContract.getAllPollIds()

      if (allPollIds.length > 0) {
        const fetchedPolls: PollState[] = await Promise.all(
          allPollIds.map(async (pollId: number) => {
            try {
              // Use fallback utility to fetch poll with automatic ABI fallback
              const pollData = await fetchPollWithFallback(
                pollId,
                legacyContractAddress,
                provider
              )

              if (!pollData) {
                return null
              }

              const modPollResponses = pollData.responsesWithAddress?.map((response: any) => response.address)
              const pollResponsesWithAddress = pollData.responsesWithAddress?.map((response: any) => ({
                address: response.address,
                response: response.address,
                isClaimed: response.isClaimed,
                weight: 1, // Default weight
                timestamp: convertTimestampToDate(Number(response.timestamp)),
                reward: pollData.rewardPerResponse
              }))

              return {
                id: pollId,
                creator: pollData.creator,
                subject: pollData.subject,
                description: pollData.description,
                category: pollData.category,
                status: pollData.status,
                createdAt: new Date(Number(pollData.endTime) * 1000 - Number(pollData.durationDays) * 24 * 60 * 60 * 1000),
                options: pollData.options,
                rewardPerResponse: pollData.rewardPerResponse,
                maxResponses: pollData.maxResponses,
                endDate: new Date(Number(pollData.endTime) * 1000),
                isOpen: pollData.isOpen,
                totalResponses: pollResponsesWithAddress?.length || 0,
                funds: pollData.funds,
                minContribution: pollData.minContribution,
                targetFund: pollData.targetFund,
                responses: modPollResponses,
                responsesWithAddress: pollResponsesWithAddress,
                viewType: pollData.viewType,
                rewardToken: pollData.rewardToken,
                fundingType: pollData.fundingType,
                rewardDistribution: pollData.rewardDistribution,
                projectId: pollData.projectId
              }
            } catch (error) {
              console.error(`Error fetching legacy poll ${pollId}:`, error)
              return null
            }
          })
        )

        // Filter out null values and only show "for-claiming" polls with unclaimed rewards
        const validPolls = fetchedPolls.filter(poll =>
          poll !== null &&
          poll.status === "for-claiming" &&
          poll.responsesWithAddress?.some(response => !response.isClaimed)
        )

        setLegacyPolls(validPolls)
      } else {
        setLegacyPolls([])
      }
    } catch (error) {
      console.error('Error fetching legacy polls:', error)
    } finally {
      setIsLoadingLegacy(false)
    }
  }

  // Statistics
  const stats = useMemo(() => {
    const totalFunds = polls.reduce((sum, poll) => sum + Number(ethers.utils.formatEther(poll.funds || "0")), 0)
    const pollsWithRemainingFunds = polls.filter(poll => {
      const funds = Number(ethers.utils.formatEther(poll.funds || "0"))
      return (poll.status === "closed" || poll.status === "cancelled") && funds > 0
    }).length

    return {
      totalProjects: projects.length,
      totalPolls: polls.length,
      totalFunds: totalFunds.toFixed(4),
      communityFund: communityFundBalance,
      pollsWithRemainingFunds,
      isPaused
    }
  }, [polls, projects, communityFundBalance, isPaused])

  // Filtered polls for table
  const filteredPolls = useMemo(() => {
    return polls.filter(poll => {
      const matchesSearch = pollSearchText === "" ||
        poll.subject.toLowerCase().includes(pollSearchText.toLowerCase()) ||
        poll.creator.toLowerCase().includes(pollSearchText.toLowerCase()) ||
        poll.id.toString().includes(pollSearchText)

      const matchesStatus = pollStatusFilter === null || poll.status === pollStatusFilter
      const matchesProject = pollProjectFilter === null || poll.projectId === pollProjectFilter

      return matchesSearch && matchesStatus && matchesProject
    })
  }, [polls, pollSearchText, pollStatusFilter, pollProjectFilter])

  // Emergency actions
  const handlePauseToggle = async () => {
    if (!isConnected || !config?.chains[config?.currentNetworkIndex]?.dpolls?.contractAddress) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const functionName = isPaused ? 'unpause' : 'pause'

      await execute({
        function: functionName,
        contractAddress: config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        abi: POLLS_DAPP_ABI,
        params: [],
        value: 0,
      })

      const result = await waitForUserOpResult()
      const formatted = formatAdminActionResult(result, isPaused ? 'Unpause contract' : 'Pause contract')

      toast(formatted)

      if (result.result === true) {
        setIsPaused(!isPaused)
        setIsPauseModalOpen(false)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle pause status",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmergencyWithdraw = async () => {
    if (!withdrawRecipient || !withdrawAmount) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive"
      })
      return
    }

    if (!ethers.utils.isAddress(withdrawRecipient)) {
      toast({
        title: "Error",
        description: "Invalid recipient address",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const amountWei = ethers.utils.parseEther(withdrawAmount)

      await execute({
        function: 'emergencyWithdraw',
        contractAddress: config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        abi: POLLS_DAPP_ABI,
        params: [withdrawToken, amountWei.toString(), withdrawRecipient],
        value: 0,
      })

      const result = await waitForUserOpResult()
      const formatted = formatAdminActionResult(result, 'Emergency withdraw')

      toast(formatted)

      if (result.result === true) {
        setIsWithdrawModalOpen(false)
        setWithdrawAmount("")
        setWithdrawRecipient("")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to withdraw funds",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusOverride = async () => {
    if (!overridePollId || !overrideStatus) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive"
      })
      return
    }

    setIsLoading(false)
    try {
      await execute({
        function: 'emergencySetPollStatus',
        contractAddress: config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        abi: POLLS_DAPP_ABI,
        params: [parseInt(overridePollId), overrideStatus],
        value: 0,
      })

      const result = await waitForUserOpResult()
      const formatted = formatAdminActionResult(result, 'Poll status override')

      toast(formatted)

      if (result.result === true) {
        setIsStatusOverrideModalOpen(false)
        setOverridePollId("")
        fetchPolls()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to override status",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const exportPollsCSV = () => {
    const csvData = filteredPolls.map(poll => ({
      'Poll ID': poll.id,
      'Subject': poll.subject,
      'Creator': poll.creator,
      'Project': poll.projectId || '',
      'Status': poll.status,
      'Funds (NERO)': ethers.utils.formatEther(poll.funds || "0"),
      'Responses': poll.totalResponses,
      'Created': poll.createdAt ? new Date(poll.createdAt).toISOString() : ''
    }))

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `super-admin-polls-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isCheckingOwner) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Result
          status="403"
          title="Access Denied"
          subTitle="Only the contract owner can access this page."
          extra={
            <div className="max-w-2xl mx-auto space-y-4">
              <Alert className="text-left">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div>
                      <strong>Contract Owner:</strong> {contractOwner ? getCompressedAddress(contractOwner) : 'Unknown'}
                    </div>
                    <div>
                      <strong>Your AA Address:</strong> {getCompressedAddress(AAaddress)}
                    </div>
                    {eoaAddress && (
                      <div>
                        <strong>Your EOA Address:</strong> {getCompressedAddress(eoaAddress)}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Neither your AA (Smart Account) address nor your EOA (MetaMask) address matches the contract owner.
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          }
        />
      </div>
    )
  }

  const projectColumns = [
    {
      title: 'Project ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      render: (address: string) => getCompressedAddress(address)
    },
    {
      title: 'Total Polls',
      dataIndex: 'totalPolls',
      key: 'totalPolls',
    },
    {
      title: 'Active Polls',
      dataIndex: 'activePolls',
      key: 'activePolls',
    },
    {
      title: 'Total Funding',
      dataIndex: 'totalFunding',
      key: 'totalFunding',
      render: (funding: string) => `${Number(funding).toFixed(4)} NERO`
    }
  ]

  const pollColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      render: (text: string) => <span className="truncate max-w-xs block">{text}</span>
    },
    {
      title: 'Creator',
      dataIndex: 'creator',
      key: 'creator',
      render: (address: string) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback>{address.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="font-mono text-sm">{getCompressedAddress(address)}</span>
        </div>
      )
    },
    {
      title: 'Project',
      dataIndex: 'projectId',
      key: 'projectId',
      render: (projectId: string) => projectId || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge variant={status === 'open' ? 'default' : 'secondary'}>
          {status}
        </Badge>
      )
    },
    {
      title: 'Funds',
      dataIndex: 'funds',
      key: 'funds',
      render: (funds: string) => `${ethers.utils.formatEther(funds || "0")} NERO`
    },
    {
      title: 'Responses',
      dataIndex: 'totalResponses',
      key: 'totalResponses'
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-red-600" />
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Contract Owner Control Panel</p>
          </div>
          <Badge variant="destructive" className="text-lg px-4 py-2">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Admin Mode
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">All Projects</TabsTrigger>
          <TabsTrigger value="polls">All Polls</TabsTrigger>
          <TabsTrigger value="legacy-claims">Legacy Claims</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Total Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalProjects}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Total Polls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalPolls}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Funds Locked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalFunds}</p>
                <p className="text-sm text-gray-500">NERO</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {stats.isPaused ? <Pause className="h-4 w-4 text-red-600" /> : <Play className="h-4 w-4 text-green-600" />}
                  Contract Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={stats.isPaused ? "destructive" : "default"} className="text-lg">
                  {stats.isPaused ? "Paused" : "Active"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Platform Summary</CardTitle>
              <CardDescription>Key metrics and statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Community Fund Balance:</span>
                <span className="font-bold">{stats.communityFund} NERO</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Polls with Remaining Funds:</span>
                <Badge variant="secondary">{stats.pollsWithRemainingFunds}</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Projects</CardTitle>
              <CardDescription>Complete list of all projects on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Table
                columns={projectColumns}
                dataSource={projects}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="polls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Polls</CardTitle>
              <CardDescription>Complete list of all polls across all projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Search by ID, subject, or creator..."
                  value={pollSearchText}
                  onChange={(e) => setPollSearchText(e.target.value)}
                  className="flex-1"
                />
                <Select
                  className="w-full md:w-48"
                  placeholder="Filter by status"
                  value={pollStatusFilter}
                  onChange={setPollStatusFilter}
                  allowClear
                  options={[
                    { value: 'new', label: 'New' },
                    { value: 'for-funding', label: 'For Funding' },
                    { value: 'open', label: 'Open' },
                    { value: 'for-claiming', label: 'For Claiming' },
                    { value: 'closed', label: 'Closed' },
                    { value: 'cancelled', label: 'Cancelled' }
                  ]}
                />
                <Select
                  className="w-full md:w-48"
                  placeholder="Filter by project"
                  value={pollProjectFilter}
                  onChange={setPollProjectFilter}
                  allowClear
                  options={projects.map(p => ({ value: p.id, label: p.id }))}
                />
                <Button onClick={exportPollsCSV} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              <Table
                columns={pollColumns}
                dataSource={filteredPolls}
                rowKey="id"
                pagination={{
                  pageSize: 20,
                  showTotal: (total) => `Total ${total} polls`
                }}
                scroll={{ x: 'max-content' }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legacy-claims" className="space-y-4">
          <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Legacy Contract Claims: Monitoring unclaimed rewards from the previous contract version.
              Use this data to identify users who need to migrate their claims.
            </AlertDescription>
          </Alert>

          {isLoadingLegacy ? (
            <div className="flex justify-center p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading legacy claims data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Legacy Claims Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Legacy Polls with Claims</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{legacyPolls.length}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Unclaimed Count</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {legacyPolls.reduce((sum, poll) =>
                        sum + (poll.responsesWithAddress?.filter(r => !r.isClaimed).length || 0), 0
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Claimed Count</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {legacyPolls.reduce((sum, poll) =>
                        sum + (poll.responsesWithAddress?.filter(r => r.isClaimed).length || 0), 0
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Unclaimed Rewards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {legacyPolls.reduce((sum, poll) => {
                        const unclaimedCount = poll.responsesWithAddress?.filter(r => !r.isClaimed).length || 0
                        const rewardPerResponse = Number(ethers.utils.formatEther(poll.rewardPerResponse || "0"))
                        return sum + (unclaimedCount * rewardPerResponse)
                      }, 0).toFixed(4)}
                    </p>
                    <p className="text-sm text-gray-500">NERO</p>
                  </CardContent>
                </Card>
              </div>

              {/* Legacy Claims Table */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Legacy Claims Overview</CardTitle>
                      <CardDescription>Polls from legacy contract with unclaimed rewards</CardDescription>
                    </div>
                    <Button
                      onClick={fetchLegacyPolls}
                      variant="outline"
                      size="sm"
                    >
                      Refresh Data
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {legacyPolls.length === 0 ? (
                    <div className="text-center py-12">
                      <Badge variant="default" className="mb-4">All Claims Processed</Badge>
                      <p className="text-muted-foreground">
                        No legacy polls with unclaimed rewards found. All users have claimed their rewards!
                      </p>
                    </div>
                  ) : (
                    <Table
                      columns={[
                        {
                          title: 'Poll ID',
                          dataIndex: 'id',
                          key: 'id',
                          width: 80
                        },
                        {
                          title: 'Subject',
                          dataIndex: 'subject',
                          key: 'subject',
                          render: (text: string) => <span className="truncate max-w-xs block">{text}</span>
                        },
                        {
                          title: 'Project',
                          dataIndex: 'projectId',
                          key: 'projectId',
                          render: (projectId: string) => projectId || '-'
                        },
                        {
                          title: 'Total Responses',
                          dataIndex: 'totalResponses',
                          key: 'totalResponses'
                        },
                        {
                          title: 'Unclaimed',
                          key: 'unclaimed',
                          render: (_: any, poll: PollState) => {
                            const unclaimedCount = poll.responsesWithAddress?.filter(r => !r.isClaimed).length || 0
                            return (
                              <Badge variant={unclaimedCount > 0 ? "destructive" : "secondary"}>
                                {unclaimedCount}
                              </Badge>
                            )
                          }
                        },
                        {
                          title: 'Claimed',
                          key: 'claimed',
                          render: (_: any, poll: PollState) => {
                            const claimedCount = poll.responsesWithAddress?.filter(r => r.isClaimed).length || 0
                            return (
                              <Badge variant="default">
                                {claimedCount}
                              </Badge>
                            )
                          }
                        },
                        {
                          title: 'Reward/Response',
                          dataIndex: 'rewardPerResponse',
                          key: 'rewardPerResponse',
                          render: (reward: string) => `${Number(ethers.utils.formatEther(reward || "0")).toFixed(4)} NERO`
                        },
                        {
                          title: 'Total Unclaimed Value',
                          key: 'unclaimedValue',
                          render: (_: any, poll: PollState) => {
                            const unclaimedCount = poll.responsesWithAddress?.filter(r => !r.isClaimed).length || 0
                            const rewardPerResponse = Number(ethers.utils.formatEther(poll.rewardPerResponse || "0"))
                            const totalValue = unclaimedCount * rewardPerResponse
                            return `${totalValue.toFixed(4)} NERO`
                          }
                        }
                      ]}
                      dataSource={legacyPolls}
                      rowKey="id"
                      pagination={{
                        pageSize: 20,
                        showTotal: (total) => `Total ${total} polls with unclaimed rewards`
                      }}
                      expandable={{
                        expandedRowRender: (poll: PollState) => {
                          const unclaimedResponders = poll.responsesWithAddress?.filter(r => !r.isClaimed) || []
                          return (
                            <div className="p-4 bg-gray-50 dark:bg-gray-900">
                              <h4 className="font-semibold mb-2">Unclaimed Responders ({unclaimedResponders.length})</h4>
                              {unclaimedResponders.length === 0 ? (
                                <p className="text-sm text-muted-foreground">All rewards have been claimed</p>
                              ) : (
                                <div className="space-y-2">
                                  {unclaimedResponders.map((responder, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                          <AvatarFallback>{responder.address.slice(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-mono">{getCompressedAddress(responder.address)}</span>
                                      </div>
                                      <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                                        Unclaimed
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        },
                        rowExpandable: (poll: PollState) => (poll.responsesWithAddress?.filter(r => !r.isClaimed).length || 0) > 0
                      }}
                      scroll={{ x: 'max-content' }}
                    />
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Warning: These are emergency functions. Use with extreme caution. All actions are irreversible.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                  {isPaused ? 'Unpause Contract' : 'Pause Contract'}
                </CardTitle>
                <CardDescription>
                  {isPaused
                    ? 'Resume all contract operations'
                    : 'Temporarily halt all contract operations except emergency functions'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setIsPauseModalOpen(true)}
                  variant={isPaused ? "default" : "destructive"}
                  className="w-full"
                >
                  {isPaused ? 'Unpause Now' : 'Pause Contract'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <DollarSign className="h-5 w-5" />
                  Emergency Withdraw
                </CardTitle>
                <CardDescription>
                  Withdraw stuck or emergency funds from the contract
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setIsWithdrawModalOpen(true)}
                  variant="destructive"
                  className="w-full"
                >
                  Emergency Withdraw
                </Button>
              </CardContent>
            </Card>

            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  Override Poll Status
                </CardTitle>
                <CardDescription>
                  Manually override the status of a stuck poll
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setIsStatusOverrideModalOpen(true)}
                  variant="outline"
                  className="w-full border-yellow-400 text-yellow-600"
                >
                  Override Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Pause/Unpause Modal */}
      <Modal
        title={isPaused ? "Unpause Contract" : "Pause Contract"}
        open={isPauseModalOpen}
        onCancel={() => setIsPauseModalOpen(false)}
        footer={[
          <Button key="cancel" variant="outline" onClick={() => setIsPauseModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            variant={isPaused ? "default" : "destructive"}
            onClick={handlePauseToggle}
            loading={isLoading}
          >
            {isPaused ? 'Yes, Unpause' : 'Yes, Pause'}
          </Button>
        ]}
      >
        <p>
          {isPaused
            ? 'Are you sure you want to unpause the contract? This will resume all operations.'
            : 'Are you sure you want to pause the contract? This will temporarily halt all operations except emergency functions.'
          }
        </p>
      </Modal>

      {/* Emergency Withdraw Modal */}
      <Modal
        title="Emergency Withdraw"
        open={isWithdrawModalOpen}
        onCancel={() => setIsWithdrawModalOpen(false)}
        footer={[
          <Button key="cancel" variant="outline" onClick={() => setIsWithdrawModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            variant="destructive"
            onClick={handleEmergencyWithdraw}
            loading={isLoading}
          >
            Withdraw
          </Button>
        ]}
      >
        <div className="space-y-4">
          <div>
            <Label>Token Address (use 0x0...0 for native token)</Label>
            <Input
              value={withdrawToken}
              onChange={(e) => setWithdrawToken(e.target.value)}
              placeholder="0x0000000000000000000000000000000000000000"
            />
          </div>
          <div>
            <Label>Amount (in NERO)</Label>
            <Input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.0"
            />
          </div>
          <div>
            <Label>Recipient Address</Label>
            <Input
              value={withdrawRecipient}
              onChange={(e) => setWithdrawRecipient(e.target.value)}
              placeholder="0x..."
            />
          </div>
        </div>
      </Modal>

      {/* Status Override Modal */}
      <Modal
        title="Override Poll Status"
        open={isStatusOverrideModalOpen}
        onCancel={() => setIsStatusOverrideModalOpen(false)}
        footer={[
          <Button key="cancel" variant="outline" onClick={() => setIsStatusOverrideModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            variant="destructive"
            onClick={handleStatusOverride}
            loading={isLoading}
          >
            Override
          </Button>
        ]}
      >
        <div className="space-y-4">
          <div>
            <Label>Poll ID</Label>
            <Input
              type="number"
              value={overridePollId}
              onChange={(e) => setOverridePollId(e.target.value)}
              placeholder="Poll ID"
            />
          </div>
          <div>
            <Label>New Status</Label>
            <Select
              className="w-full"
              value={overrideStatus}
              onChange={setOverrideStatus}
              options={[
                { value: 'new', label: 'New' },
                { value: 'for-funding', label: 'For Funding' },
                { value: 'open', label: 'Open' },
                { value: 'for-claiming', label: 'For Claiming' },
                { value: 'closed', label: 'Closed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
