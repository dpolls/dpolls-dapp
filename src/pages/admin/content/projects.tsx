"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui_v3/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v3/card"
import { Input } from "@/components/ui_v3/input"
import { Label } from "@/components/ui_v3/label"
import { Badge } from "@/components/ui_v3/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui_v3/dialog"
import { useToast } from "@/components/ui_v3/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_v3/tabs"
import { Plus, Users, BarChart3, Settings, Trash2, UserMinus, UserPlus } from "lucide-react"
import { ethers } from 'ethers'
import { POLLS_DAPP_ABI } from '@/constants/abi'
import { useConfig, useSignature } from '@/hooks'

interface Project {
  id: string
  name: string
  owner: string
  totalPolls: number
  activePolls: number
  totalFunding: string
  isOwner: boolean
}

interface ProjectsProps {
  AAaddress: string
  isWalletConnected: boolean
  setIsWalletConnected: (connected: boolean) => void
}

export default function Projects({ AAaddress, isWalletConnected, setIsWalletConnected }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectOwner, setNewProjectOwner] = useState("")
  const { toast } = useToast()
  const config = useConfig()
  const { simpleAccountInstance } = useSignature()

  useEffect(() => {
    if (AAaddress) {
      fetchProjects()
    }
  }, [AAaddress])

  const fetchProjects = async () => {
    if (!AAaddress || !config?.chains[config?.currentNetworkIndex]?.dpolls?.contractAddress) return

    try {
      setIsLoading(true)

      // Create a provider using the RPC URL from config
      const provider = new ethers.providers.JsonRpcProvider(config.chains[config.currentNetworkIndex].chain.rpc)

      // Create a contract instance
      const pollsContract = new ethers.Contract(
        config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        POLLS_DAPP_ABI,
        provider
      )

      // Get all project IDs
      const allProjectIds = await pollsContract.getAllProjects()

      if (allProjectIds.length > 0) {
        const fetchedProjects: Project[] = await Promise.all(
          allProjectIds.map(async (projectId: string) => {
            try {
              // Get project details
              const projectOwner = await pollsContract.getProjectOwner(projectId)
              const [totalPolls, activePolls, totalFunding] = await pollsContract.getProjectStats(projectId)

              return {
                id: projectId,
                name: projectId,
                owner: projectOwner,
                totalPolls: totalPolls.toNumber(),
                activePolls: activePolls.toNumber(),
                totalFunding: ethers.utils.formatEther(totalFunding),
                isOwner: projectOwner.toLowerCase() === AAaddress.toLowerCase()
              }
            } catch (error) {
              console.error(`Error fetching project ${projectId}:`, error)
              return null
            }
          })
        )

        // Filter out null values
        const validProjects = fetchedProjects.filter(project => project !== null)
        setProjects(validProjects)
      } else {
        setProjects([])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      })
      return
    }

    if (!newProjectOwner.trim()) {
      toast({
        title: "Error",
        description: "Project owner address is required",
        variant: "destructive",
      })
      return
    }

    if (!ethers.utils.isAddress(newProjectOwner)) {
      toast({
        title: "Error",
        description: "Invalid owner address",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      if (!simpleAccountInstance) {
        throw new Error("Wallet not connected")
      }

      // Create transaction data
      const pollsContract = new ethers.Contract(
        config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        POLLS_DAPP_ABI,
        new ethers.providers.JsonRpcProvider(config.chains[config.currentNetworkIndex].chain.rpc)
      )

      const txData = pollsContract.interface.encodeFunctionData("createProject", [
        newProjectName.trim(),
        newProjectOwner.trim()
      ])

      // Send transaction using execute method
      const tx = await simpleAccountInstance.execute(
        config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        0,
        txData
      )

      toast({
        title: "Transaction Sent",
        description: "Creating project...",
      })

      // Wait for transaction
      await tx.wait()

      toast({
        title: "Success",
        description: `Project "${newProjectName}" created successfully!`,
      })

      // Reset form and close dialog
      setNewProjectName("")
      setNewProjectOwner("")
      setIsCreateDialogOpen(false)

      // Refresh projects
      await fetchProjects()
    } catch (error: any) {
      console.error('Error creating project:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const transferOwnership = async (projectId: string, newOwner: string) => {
    if (!ethers.utils.isAddress(newOwner)) {
      toast({
        title: "Error",
        description: "Invalid new owner address",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      if (!simpleAccountInstance) {
        throw new Error("Wallet not connected")
      }

      const pollsContract = new ethers.Contract(
        config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        POLLS_DAPP_ABI,
        new ethers.providers.JsonRpcProvider(config.chains[config.currentNetworkIndex].chain.rpc)
      )

      const txData = pollsContract.interface.encodeFunctionData("transferProjectOwnership", [
        projectId,
        newOwner
      ])

      const tx = await simpleAccountInstance.execute(
        config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        0,
        txData
      )

      toast({
        title: "Transaction Sent",
        description: "Transferring ownership...",
      })

      await tx.wait()

      toast({
        title: "Success",
        description: "Project ownership transferred successfully!",
      })

      // Refresh projects
      await fetchProjects()
    } catch (error: any) {
      console.error('Error transferring ownership:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to transfer ownership",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const initializeDefaultProject = async () => {
    try {
      setIsLoading(true)

      if (!simpleAccountInstance) {
        throw new Error("Wallet not connected")
      }

      const pollsContract = new ethers.Contract(
        config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        POLLS_DAPP_ABI,
        new ethers.providers.JsonRpcProvider(config.chains[config.currentNetworkIndex].chain.rpc)
      )

      const txData = pollsContract.interface.encodeFunctionData("initializeDefaultProject", [])

      const tx = await simpleAccountInstance.execute(
        config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        0,
        txData
      )

      toast({
        title: "Transaction Sent",
        description: "Initializing default project...",
      })

      await tx.wait()

      toast({
        title: "Success",
        description: "Default project initialized and existing polls migrated!",
      })

      // Refresh projects
      await fetchProjects()
    } catch (error: any) {
      console.error('Error initializing default project:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to initialize default project",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects</h2>
        <div className="flex gap-2">
          <Button onClick={initializeDefaultProject} variant="outline" disabled={isLoading}>
            Initialize Default Project
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Create a new project to organize your polls.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="Enter project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-owner">Owner Address</Label>
                  <Input
                    id="project-owner"
                    placeholder="0x..."
                    value={newProjectOwner}
                    onChange={(e) => setNewProjectOwner(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Only the owner can create polls in this project
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createProject} disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading && projects.length === 0 ? (
        <div className="flex justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first project to organize your polls.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onTransferOwnership={transferOwnership}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ProjectCardProps {
  project: Project
  onTransferOwnership: (projectId: string, newOwner: string) => void
  isLoading: boolean
}

function ProjectCard({ project, onTransferOwnership, isLoading }: ProjectCardProps) {
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [newOwnerAddress, setNewOwnerAddress] = useState("")

  const handleTransferOwnership = () => {
    onTransferOwnership(project.id, newOwnerAddress)
    setNewOwnerAddress("")
    setIsTransferDialogOpen(false)
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {project.name}
            </CardTitle>
            <CardDescription>
              Owner: {project.owner.slice(0, 6)}...{project.owner.slice(-4)}
              {project.isOwner && <Badge variant="secondary" className="ml-2">You</Badge>}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{project.totalPolls}</div>
            <div className="text-xs text-muted-foreground">Total Polls</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{project.activePolls}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{Number(project.totalFunding).toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">ETH Funded</div>
          </div>
        </div>

        {project.isOwner && (
          <div className="pt-4 border-t">
            <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <UserMinus className="mr-2 h-4 w-4" />
                  Transfer Ownership
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Transfer Project Ownership</DialogTitle>
                  <DialogDescription>
                    Transfer ownership of "{project.name}" to another address.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-owner">New Owner Address</Label>
                    <Input
                      id="new-owner"
                      placeholder="0x..."
                      value={newOwnerAddress}
                      onChange={(e) => setNewOwnerAddress(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      This action cannot be undone. The new owner will have full control over the project.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTransferOwnership}
                    disabled={isLoading || !newOwnerAddress.trim()}
                    variant="destructive"
                  >
                    Transfer Ownership
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}