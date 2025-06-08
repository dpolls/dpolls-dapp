"use client"

import { useState } from "react";
import { useNavigate } from 'react-router-dom';

import { POLLS_DAPP_ABI, } from '@/constants/abi';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';
import { useSendUserOp, useSignature } from '@/hooks';
import { ethers } from 'ethers';

import { Button } from "@/components/ui_v3/button";
import { Progress } from "@/components/ui_v3/progress";
//import { Switch } from "@/components/ui_v3/switch";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

import PollStep1 from "@/components/poll-steps/new-poll-step1";
import PollStep2 from "@/components/poll-steps/new-poll-step2";
import { PollState } from '@/types/poll';
import PollStep3 from "../poll-steps/new-poll-step3";

const STEPS = [
  { id: 1, title: "Content", description: "Question, description & duration" },
  { id: 2, title: "Options", description: "Poll choices & display type" },
  { id: 3, title: "Settings", description: "Funding, rewards & limits" },
]

interface NewPollModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NewPollModal({ isOpen, onClose }: NewPollModalProps) {
  const { AAaddress, isConnected, simpleAccountInstance } = useSignature();
  const navigate = useNavigate();

  const { execute, waitForUserOpResult, sendUserOp } = useSendUserOp();
  const [isLoading, setIsLoading] = useState(false);
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);

  const [currentStep, setCurrentStep] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleCreatePoll = async (pollForm: PollState) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setUserOpHash(null);
    setTxStatus('');

    try {
      const rewardPerResponse = pollForm.rewardDistribution === "split" ?  "0" : pollForm.rewardPerResponse;

      const pollData = [
        pollForm.subject,
        pollForm.description,
        pollForm.category,
        pollForm.viewType,
        pollForm.options,
        ethers.utils.parseEther(rewardPerResponse).toString(),
        parseInt(pollForm.duration || "90"),
        parseInt(pollForm.maxResponses || "1000"),
        ethers.utils.parseEther(pollForm.minContribution || "0.000001").toString(),
        pollForm.fundingType,
        pollForm.openImmediately,
        ethers.utils.parseEther(pollForm.targetFund || "0").toString(),
        ethers.constants.AddressZero,
        pollForm.rewardDistribution
      ];
      console.log('pollData', pollData)

      console.log('pollForm.targetFund', pollForm.targetFund)
      let value = null;
      if (pollForm.fundingType === "self-funded") {
        value = ethers.utils.parseEther(pollForm.targetFund);
      } else {
        value = ethers.utils.parseEther("0");
      }

      console.log('value', value)

      await execute({
        function: 'createPoll',
        contractAddress: CONTRACT_ADDRESSES.dpollsContract,
        abi: POLLS_DAPP_ABI,
        params: pollData,
        value: value
      });

      const result = await waitForUserOpResult();
      setUserOpHash(result.userOpHash);
      setIsPolling(true);
      navigate("/polls/live");

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
    }
  };

  // Form state
  const [formData, setFormData] = useState<any>({
    // Step 1: Content
    subject: "",
    description: "",
    category: "",
    duration: "",
  
    // Step 2: Options
    viewType: "text",
    options: ["", ""],
  
    // Step 3: Settings
    fundingType: "self-funded",
    openImmediately: true,
    rewardDistribution: "split",
    targetFund: "",
    rewardPerResponse: "",
    maxResponses: "",
    voteWeight: "simple",
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
    console.log("Poll created with data:", formData)
    await handleCreatePoll(formData);
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return (
          formData.subject &&
          formData.description &&
          formData.category &&
          formData.duration
        )
      case 2:
        return formData.options.every((option) => option.trim() !== "")
      case 3:
        return formData.fundingType && (formData.rewardDistribution === "split" || formData.rewardPerResponse)
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
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === step.id
                    ? "bg-primary text-primary-foreground text-white"
                    : currentStep > step.id
                      ? "bg-green-500 text-white"
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
            <Button type="submit" className="flex items-center text-white">
              Create Poll
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!isStepValid(currentStep)}
              className="flex items-center text-white"
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
  )
}
