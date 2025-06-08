"use client"

import { useState, useEffect, useRef } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui_v3/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v3/card"
import { cn } from "@/lib/utils"

interface TourStep {
  id: string
  title: string
  description: string
  target: string
  position: "top" | "bottom" | "left" | "right"
  action?: string
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Poll Admin!",
    description:
      "Let's take a tour of how to create and manage polls from start to finish. This guide will show you the complete poll lifecycle.",
    target: "dashboard-header",
    position: "bottom",
  },
  {
    id: "create-poll-nav",
    title: "Creating Polls",
    description: "Click here to start creating a new poll.",
    target: "create-poll-nav",
    position: "right",
    action: "Click to navigate to poll creation",
  },
  // {
  //   id: "create-poll-footer",
  //   title: "Alternative: Quick Create",
  //   description: "You can also quickly create a poll using this floating action button at the bottom of the screen.",
  //   target: "create-poll-footer",
  //   position: "top",
  //   action: "Click the + icon to create a poll",
  // },
  {
    id: "poll-form",
    title: "Poll Creation Form",
    description: "Fill out your poll details here. Add questions, set options, and configure your poll settings.",
    target: "poll-form",
    position: "top",
    action: "Complete the form and save your poll",
  },
  {
    id: "manage-polls",
    title: "Manage Polls",
    description:
      "Check your created polls. Open them for funding, to collect respones, or close them once you've received the number of needed responses.",
    target: "manage-polls-nav",
    position: "right",
    action: "Click to view active polls",
  },
  {
    id: "active-polls",
    title: "Active Polls",
    description:
      "Respond to active polls.",
    target: "active-polls-nav",
    position: "right",
    action: "Click to view active polls",
  },
  {
    id: "poll-funding",
    title: "Fund Polls",
    description:
      "Support polls to reach their funding goals.",
    target: "funding-polls-nav",
    position: "right",
    action: "Select a poll to manage funding",
  },
  {
    id: "claim-reward",
    title: "Claim Rewards",
    description:
      "Claim rewards to polls you responded to.",
    target: "claim-polls-nav",
    position: "right",
    action: "Select a poll to manage funding",
  },
  {
    id: "leaderboard-nav",
    title: "See Your Standing",
    description: "Access the leaderboard to see where you stand in the global, monthly, and weekly standing for extra rewards.",
    target: "leaderboard-nav",
    position: "right",
    action: "Click to view leaderboard",
  },
  {
    id: "complete",
    title: "Tour Complete!",
    description: "You've learned the complete poll lifecycle! You can restart this tour anytime from the help menu.",
    target: "dashboard-header",
    position: "bottom",
  },
]

interface GuidedTourProps {
  isActive: boolean
  onClose: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function GuidedTour({ isActive, onClose, activeTab, setActiveTab }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive) return

    const updateTooltipPosition = () => {
      const step = tourSteps[currentStep]
      const targetElement = document.querySelector(`[data-tour="${step.target}"]`)

      if (targetElement && tooltipRef.current) {
        const targetRect = targetElement.getBoundingClientRect()
        const tooltipRect = tooltipRef.current.getBoundingClientRect()

        let top = 0
        let left = 0

        switch (step.position) {
          case "top":
            top = targetRect.top - tooltipRect.height - 10
            left = targetRect.left + (targetRect.width - tooltipRect.width) / 2
            break
          case "bottom":
            top = targetRect.bottom + 10
            left = targetRect.left + (targetRect.width - tooltipRect.width) / 2
            break
          case "left":
            top = targetRect.top + (targetRect.height - tooltipRect.height) / 2
            left = targetRect.left - tooltipRect.width - 10
            break
          case "right":
            top = targetRect.top + (targetRect.height - tooltipRect.height) / 2
            left = targetRect.right + 10
            break
        }

        // Ensure tooltip stays within viewport
        const padding = 10
        top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding))
        left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding))

        setTooltipPosition({ top, left })
      }
    }

    updateTooltipPosition()
    window.addEventListener("resize", updateTooltipPosition)
    window.addEventListener("scroll", updateTooltipPosition)

    return () => {
      window.removeEventListener("resize", updateTooltipPosition)
      window.removeEventListener("scroll", updateTooltipPosition)
    }
  }, [currentStep, isActive])

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextStepData = tourSteps[currentStep + 1]

      // Auto-navigate to required tabs
      if (nextStepData.target === "create-poll-nav" || nextStepData.target === "poll-form") {
        setActiveTab("create-poll")
      } else if (nextStepData.target === "manage-polls-nav") {
        setActiveTab("created-polls")
      } else if (nextStepData.target === "claim-polls-nav") {
        setActiveTab("claiming")
      } else if (nextStepData.target === "active-polls-nav" || nextStepData.target === "poll-list") {
        setActiveTab("active-polls")
      } else if (
        nextStepData.target === "dashboard-nav" ||
        nextStepData.target === "metrics-cards" ||
        nextStepData.target === "recent-polls"
      ) {
        setActiveTab("dashboard")
      } else if (nextStepData.target === "leaderboard-nav" || nextStepData.target === "leaderboard-content") {
        setActiveTab("leaderboard")
      } else if (nextStepData.target === "analytics-nav" || nextStepData.target === "analytics-section") {
        setActiveTab("analytics")
      }

      setCurrentStep(currentStep + 1)
    } else {
      setCurrentStep(0)
      setActiveTab("dashboard")
      onClose()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepData = tourSteps[currentStep - 1]

      // Auto-navigate to required tabs
      if (prevStepData.target === "create-poll-nav" || prevStepData.target === "poll-form") {
        setActiveTab("create-poll")
      } else if (prevStepData.target === "manage-polls-nav") {
        setActiveTab("created-polls")
      } else if (prevStepData.target === "claim-polls-nav") {
        setActiveTab("claiming")
      } else if (prevStepData.target === "active-polls-nav" || prevStepData.target === "poll-list") {
        setActiveTab("active-polls")
      } else if (
        prevStepData.target === "dashboard-nav" ||
        prevStepData.target === "metrics-cards" ||
        prevStepData.target === "recent-polls"
      ) {
        setActiveTab("dashboard")
      } else if (prevStepData.target === "leaderboard-nav" || prevStepData.target === "leaderboard-content") {
        setActiveTab("leaderboard")
      } else if (prevStepData.target === "analytics-nav" || prevStepData.target === "analytics-section") {
        setActiveTab("analytics")
      }

      setCurrentStep(currentStep - 1)
    }
  }

  const skipTour = () => {
    onClose()
  }

  if (!isActive) return null

  const step = tourSteps[currentStep]
  const targetElement = document.querySelector(`[data-tour="${step.target}"]`)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={skipTour} />

      {/* Highlight */}
      {targetElement && (
        <div
          className="fixed border-2 border-primary rounded-lg z-50 pointer-events-none"
          style={{
            top: targetElement.getBoundingClientRect().top - 4,
            left: targetElement.getBoundingClientRect().left - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <Card
        ref={tooltipRef}
        className="fixed z-50 w-80 shadow-lg bg-white"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{step.title}</CardTitle>
            <Button variant="ghost" size="icon" onClick={skipTour}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-sm">
            Step {currentStep + 1} of {tourSteps.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">{step.description}</p>

          {step.action && (
            <div className="bg-muted p-2 rounded text-xs mb-4">
              <strong>Action:</strong> {step.action}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={prevStep} disabled={currentStep === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button size="sm" onClick={nextStep} className="text-white">
                {currentStep === tourSteps.length - 1 ? "Finish" : "Next"}
                {currentStep !== tourSteps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={skipTour}>
              Skip Tour
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="mt-4">
            <div className="flex gap-1">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={cn("h-1 flex-1 rounded", index <= currentStep ? "bg-primary" : "bg-muted")}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
