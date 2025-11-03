"use client"

import type React from "react";

import { useEffect, useRef, useState, useContext } from "react";
import { Link } from 'react-router-dom';

import { POLLS_DAPP_ABI, } from '@/constants/abi';
import { PollState } from '@/types/poll';
import { convertTimestampToDate } from '@/utils/format';
import { ethers } from 'ethers';
import { fetchPollWithFallback } from '@/utils/pollFetcher';

import { VotePollModal } from "@/components/modals/vote-poll-modal";
import { Button } from "@/components/ui_v3/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v3/card";
import LandingPageHeader from "@/pages/landing/landing-header";
import { calculateTimeLeft } from "@/utils";
import { getRandomBoolean } from "@/utils/booleanUtils";
import { getTagColor } from "@/utils/tagColors";
import { Tag, Card as AntdCard, Avatar } from "antd";
import { ArrowRight, CircleDollarSign, Clock, Coins, Eye, Shield, Trophy, Users } from "lucide-react";
import { ConfigContext } from '@/contexts';
import { useToast } from '@/components/ui_v3/use-toast';

const TypewriterText = () => {
  const words = ["businesses", "surveys", "art contests", "debates"]
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const currentWord = words[currentWordIndex]

    const timeout = setTimeout(
      () => {
        if (isPaused) {
          setIsPaused(false)
          setIsDeleting(true)
          return
        }

        if (isDeleting) {
          setCurrentText(currentWord.substring(0, currentText.length - 1))
          if (currentText === "") {
            setIsDeleting(false)
            setCurrentWordIndex((prev) => (prev + 1) % words.length)
          }
        } else {
          setCurrentText(currentWord.substring(0, currentText.length + 1))
          if (currentText === currentWord) {
            setIsPaused(true)
          }
        }
      },
      isDeleting ? 50 : isPaused ? 2000 : 100,
    )

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, isPaused, currentWordIndex, words])

  return (
    <span className="text-primary">
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

const AnimatedSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  )
}

export default function LandingPage() {
  const config = useContext(ConfigContext);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string>('');
  const [email, setEmail] = useState("")
  const [selectedPoll, setSelectedPoll] = useState<any | null>(null)
  const [isPollModalOpen, setIsPollModalOpen] = useState(false)
  const [featureFlagNew, setFeatureFlagNew] = useState(true);
  const [featuredPolls, setFeaturedPolls] = useState<PollState[]>([]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEmail("")
  }

  const handleViewPoll = (poll: any) => {
    setSelectedPoll(poll)
    setIsPollModalOpen(true)
  }

  const closePollModal = () => {
    setIsPollModalOpen(false)
    setSelectedPoll(null)
  }

  useEffect(() => {
    fetchPolls();
  }, []); 

  const fetchPolls = async () => {
    if (!config?.chains[config?.currentNetworkIndex]?.dpolls?.contractAddress) {
      toast({
        title: "Error",
        description: "Contract address not configured",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create a provider using the RPC URL from config
      const provider = new ethers.providers.JsonRpcProvider(config.chains[config.currentNetworkIndex].chain.rpc);
      
      // Create a contract instance for the NFT contract
      const pollsContract = new ethers.Contract(
        config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        POLLS_DAPP_ABI,
        provider
      );
      
      // Get all poll IDs
      const allPollIds = await pollsContract.getAllPollIds();
      if (allPollIds.length > 0) {
        const fetchedPolls: PollState[] = await Promise.all(
          allPollIds.map(async (pollId: number) => {
            try {
              // Use fallback utility to fetch poll with automatic ABI fallback
              const pollData = await fetchPollWithFallback(
                pollId,
                config.chains[config.currentNetworkIndex].dpolls.contractAddress,
                provider
              );

              if (!pollData) {
                return null;
              }

              // Transform responses to match expected format
              const modPollResponses = pollData.responsesWithAddress?.map((response: any) => {
                return response.address;
              });

              const pollResonsesWithAddress = pollData.responsesWithAddress?.map((response: any) => {
                return {
                  address: response.address,
                  response: response.address,
                  isClaimed: response.isClaimed,
                  weight: 1, // Default weight
                  timestamp: convertTimestampToDate(Number(response.timestamp)),
                  reward: pollData.rewardPerResponse
                }
              });

              // Format the poll data
              const result = {
                id: pollId,
                creator: pollData.creator,
                subject: pollData.subject,
                category: pollData.category,
                description: pollData.description,
                status: pollData.status,
                createdAt: new Date(Number(pollData.endTime) * 1000 - Number(pollData.durationDays) * 24 * 60 * 60 * 1000),
                options: pollData.options,
                rewardPerResponse: pollData.rewardPerResponse,
                maxResponses: pollData.maxResponses,
                endDate: new Date(Number(pollData.endTime) * 1000),
                isOpen: pollData.isOpen,
                isFeatured: true || getRandomBoolean(),
                totalResponses: pollData.totalResponses,
                funds: pollData.funds,
                minContribution: pollData.minContribution,
                targetFund: pollData.targetFund,
                responses: modPollResponses,
                responsesWithAddress: pollResonsesWithAddress
              };
              return result;
            } catch (error) {
              console.error(`Error fetching Poll #${pollId}:`, error);
              return null;
            }
          })
        );

        // Filter out any null values from failed fetches
        const validPolls = fetchedPolls.filter(poll => poll !== null)
          .filter(poll => poll.status === "open")
          .filter(poll => calculateTimeLeft(poll.endDate) !== "Ended")
          .filter(poll => poll.isFeatured);
        
        if (validPolls.length > 0) {
          setFeaturedPolls(validPolls);
          setTxStatus(`Found ${validPolls.length} Polls`);
        } else {
          setTxStatus('No valid polls found');
          // Show sample polls as fallback
          setFeaturedPolls([]);
        }
      } else {
        setTxStatus('No polls found');
        setFeaturedPolls([]);
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
      setTxStatus('Error fetching polls');
      
      // Fallback to sample polls in case of error
      setFeaturedPolls([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pr-9">
      {/* Header */}
      <LandingPageHeader />

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">D</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            polls for <TypewriterText />
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create decentralized polls and contests with built-in rewards. Fair, transparent, and profitable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/polls/new">
              <Button size="lg" className="w-full sm:w-auto">
                Create Your First Poll
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/polls/live">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Polls
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Polls Section */}
      <AnimatedSection>
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Respond to Polls</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 8 }).map((_, index) => (
                  <AntdCard
                    key={index}
                    loading={true}
                    style={{ minWidth: 300 }}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <AntdCard.Meta
                      avatar={<Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=1" />}
                      title="Card title"
                      description={
                        <>
                          <p>This is the description</p>
                          <p>This is the description</p>
                        </>
                      }
                    />
                  </AntdCard>
                ))
              ) : (
                featuredPolls.map((poll: any) => (
                  <Card key={poll.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2">
                          <Tag
                            color={getTagColor('category', poll.category)}
                          >
                            {poll.category}
                          </Tag>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>
                            {featureFlagNew ? 
                              poll.endDate && calculateTimeLeft(poll.endDate)
                              :
                              poll.timeLeft
                            }
                          </span>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{poll.subject}</CardTitle>
                      <CardDescription>{poll.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-1" />
                          {featureFlagNew ? 
                            poll.responses.length
                            :
                            poll.participants
                          } participants
                        </div>
                        <div className="flex items-center text-sm font-semibold text-primary">
                          <CircleDollarSign className="h-4 w-4 mr-1" />
                          {featureFlagNew ? 
                            parseFloat(ethers.utils.formatEther(poll.targetFund || '0'))
                            :
                            poll.prize
                          } NERO
                        </div>
                      </div>
                      <Button className="w-full" variant="outline" onClick={() => handleViewPoll(poll)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Poll
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <div className="text-center">
              <Link to="/polls/live">
                <Button size="lg" className="">
                  View All Polls
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* As Used By Section */}
      {/* <AnimatedSection>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-8">As used by</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
                <div className="flex justify-center">
                  <Image
                    src="/placeholder.svg?height=60&width=120&text=Company+A"
                    alt="Company A"
                    width={120}
                    height={60}
                    className="grayscale hover:grayscale-0 transition-all"
                  />
                </div>
                <div className="flex justify-center">
                  <Image
                    src="/placeholder.svg?height=60&width=120&text=Company+B"
                    alt="Company B"
                    width={120}
                    height={60}
                    className="grayscale hover:grayscale-0 transition-all"
                  />
                </div>
                <div className="flex justify-center">
                  <Image
                    src="/placeholder.svg?height=60&width=120&text=Company+C"
                    alt="Company C"
                    width={120}
                    height={60}
                    className="grayscale hover:grayscale-0 transition-all"
                  />
                </div>
                <div className="flex justify-center">
                  <Image
                    src="/placeholder.svg?height=60&width=120&text=Company+D"
                    alt="Company D"
                    width={120}
                    height={60}
                    className="grayscale hover:grayscale-0 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection> */}

      {/* Why Create Polls Section */}
      <AnimatedSection>
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why create polls with NERO dpolls?</h2>
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Trophy className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Make polls, get creative</h3>
                      <p className="text-muted-foreground">Reward your community for their feedback</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Coins className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">We split all charges 70 (you)/30 (us)</h3>
                      <p className="text-muted-foreground">Keep most of what you earn from your polls</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Shield className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">
                        Let anyone vote—or allowlist. The choice is yours, and it's anti-bot
                      </h3>
                      <p className="text-muted-foreground">Control who participates with built-in bot protection</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Trophy className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Create a rewards pool for winners</h3>
                      <p className="text-muted-foreground">Incentivize participation with attractive rewards</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Coins className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Keep the money you earn, or put it back into rewards pool</h3>
                      <p className="text-muted-foreground">Flexible reward distribution options</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Shield className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">
                        Give players rewards, points, credentials—all data is onchain
                      </h3>
                      <p className="text-muted-foreground">Transparent, verifiable achievements</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* <div className="max-w-md mx-auto">
                <form onSubmit={handleEmailSubmit} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                    required
                  />
                  <Button className="" type="submit">Get Started</Button>
                </form>
              </div> */}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* How It Works Section */}
      <AnimatedSection>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How it works</h2>
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-6">To create a poll:</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground font-semibold text-sm ">1</span>
                    </div>
                    <p className="text-muted-foreground">
                      <strong>Indentify your subject:</strong> What feedback are you looking for?
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground font-semibold text-sm ">2</span>
                    </div>
                    <p className="text-muted-foreground">
                      <strong>Select a Category</strong>
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground font-semibold text-sm ">3</span>
                    </div>
                    <p className="text-muted-foreground">
                      <strong>Set a duration</strong> for the community to respond
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground font-semibold text-sm ">4</span>
                    </div>
                    <p className="text-muted-foreground">
                      <strong>Generate options.</strong> Use AI to generate them or input them yourself.
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground font-semibold text-sm ">5</span>
                    </div>
                    <p className="text-muted-foreground">
                      <strong>Choose who funds the rewards:</strong> Fund it yourself or crowdfund it.
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground font-semibold text-sm ">6</span>
                    </div>
                    <p className="text-muted-foreground">
                      <strong>Let NERO AA Payment handle the gas fees.</strong> Choose to give back to your community.
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <Link to="/polls/live">
                  <Button size="lg" className="">
                    View Polls
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">D</span>
                </div>
                <span className="text-xl font-bold">dpolls</span>
              </div>
              <p className="text-muted-foreground">Decentralized polling platform for the future of decision making.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link to="/polls/live" className="hover:text-foreground">
                    Live Polls
                  </Link>
                </li>
                <li>
                  <Link to="/polls/new" className="hover:text-foreground">
                    Create Poll
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    How it Works
                  </Link>
                </li>
              </ul>
            </div>
            {/* <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link to="#" className="hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-foreground">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div> */}
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 NERO dPolls. All rights reserved.</p>
          </div>
        </div>
      </footer>
      {/* Poll Modal */}
      <VotePollModal
        featureFlagNew={featureFlagNew} 
        poll={selectedPoll} isOpen={isPollModalOpen} onClose={closePollModal}
        fetchPolls={fetchPolls}
      />
    </div>
  )
}