"use client"

import { useState, useContext } from "react";
import { Link, useNavigate } from 'react-router-dom';

import { useSendUserOp, useSignature } from '@/hooks';
import { Button } from "@/components/ui_v3/button";
import { Progress } from "@/components/ui_v3/progress";
//import { Switch } from "@/components/ui_v3/switch";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

import PollStep1 from "@/components/poll-steps/new-poll-step1";
import PollStep2 from "@/components/poll-steps/new-poll-step2";
import PollStep3 from "@/components/poll-steps/new-poll-step3";
import LandingPageHeader from "@/pages/landing/landing-header";
import { PollState } from '@/types/poll';
import { handleCreatePoll } from '@/utils/pollCrudUtil';
import { ConfigContext } from '@/contexts';
import { useToast } from '@/components/ui_v3/use-toast';

const STEPS = [
  { id: 1, title: "Content", description: "Question, description & duration" },
  { id: 2, title: "Options", description: "Poll choices & display type" },
  { id: 3, title: "Settings", description: "Funding, rewards & limits" },
]

export default function CreatePollPage() {
  const config = useContext(ConfigContext);
  const { toast } = useToast();
  const { AAaddress, isConnected, simpleAccountInstance } = useSignature();
  const navigate = useNavigate();

  const { execute, waitForUserOpResult, sendUserOp } = useSendUserOp();
  const [isLoading, setIsLoading] = useState(false);
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);

  const [currentStep, setCurrentStep] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleCreatePollWrapper = async (pollForm: PollState) => {
    if (!config?.chains[config?.currentNetworkIndex]?.dpolls?.contractAddress) {
      toast({
        title: "Error",
        description: "Contract address not configured",
        variant: "destructive",
      });
      return;
    }
    await handleCreatePoll({
      pollForm,
      AAaddress,
      isConnected,
      execute,
      waitForUserOpResult,
      contractAddress: config.chains[config.currentNetworkIndex].dpolls.contractAddress,
      onSuccess: () => {
        setTimeout(() => {
          navigate("/polls/live");
        }, 1000);
      },
      onLoadingChange: setIsLoading,
      onUserOpHashChange: setUserOpHash,
      onTxStatusChange: setTxStatus,
      onPollingChange: setIsPolling,
    });
  };

  // Form state
  const [formData, setFormData] = useState<any>({
    // Step 1: Content
    subject: "",
    description: "",
    category: "",
    duration: "",
    useAI: false,
  
    // Step 2: Options
    viewType: "text",
    numOptions: 2,
    options: [],
  
    // Step 3: Settings
    fundingType: "self-funded",
    openImmediately: true,
    rewardDistribution: "equal-share",
    targetFund: "",
    rewardPerResponse: "",
    maxResponses: "",
    voteWeight: "simple",
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev: typeof formData) => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setIsTransitioning(false)
      }, 150)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setIsTransitioning(false)
      }, 150)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleCreatePollWrapper(formData);
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return (
          formData.subject &&
          formData.category &&
          formData.duration
        )
      case 2:
        return formData.options?.every((option: string) => option.trim() !== "")
      case 3:
        if (!formData.fundingType) return false;
        
        if (formData.rewardDistribution === "equal-share") {
          // For equal-share, targetFund is required
          return formData.targetFund && formData.targetFund.trim() !== "";
        } else if (formData.rewardDistribution === "fixed") {
          // For fixed, rewardPerResponse is required
          return formData.rewardPerResponse && formData.rewardPerResponse.trim() !== "";
        }
        
        return false;
      default:
        return false
    }
  }

  const renderStepContent = () => {
    const baseClasses = `transition-all duration-300 ${isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
      }`

    switch (currentStep) {
      case 1:
        return (
          <div className={baseClasses}>
            <PollStep1 formData={formData} updateFormData={updateFormData} />
          </div>
        )

      case 2:
        return (
          <div className={baseClasses}>
            <PollStep2 formData={formData} updateFormData={updateFormData} />
          </div>
        )

      case 3:
        return (
          <div className={baseClasses}>
            <PollStep3 formData={formData} updateFormData={updateFormData} />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <LandingPageHeader />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link to="/polls/live" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Live Polls
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Create New Poll</h1>
          <p className="text-muted-foreground text-lg">
            Set up your poll or contest and start earning from participant fees
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : currentStep > step.id
                        ? "bg-green-500"
                        : "bg-muted text-muted-foreground"
                    }`}
                >
                  {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`h-0.5 w-16 md:w-32 mx-2 ${currentStep > step.id ? "bg-green-500" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">{STEPS[currentStep - 1].title}</h2>
            <p className="text-muted-foreground">{STEPS[currentStep - 1].description}</p>
          </div>
          <Progress value={(currentStep / STEPS.length) * 100} className="mt-4" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step Content */}
          <div className="min-h-[500px]">{renderStepContent()}</div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep === STEPS.length ? (
              <Button type="submit" className="flex items-center" disabled={isLoading}>
                {isLoading ? (
                  <>
                    Creating Poll...
                    <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </>
                ) : (
                  <>
                    Create Poll
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className="flex items-center"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Step Validation Info */}
          {!isStepValid(currentStep) && (
            <div className="text-center text-sm text-muted-foreground">
              Please fill in all required fields to continue
            </div>
          )}
        </form>

        {/* Cost Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Deployment cost: ~$0.50 USD (varies with gas prices)</p>
        </div>
      </div>
    </div>
  )
}
