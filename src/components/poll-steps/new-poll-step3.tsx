"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v3/card";
import { Input } from "@/components/ui_v3/input";
import { Label } from "@/components/ui_v3/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui_v3/radio-group";
import { PollState } from "@/types/poll";
import { ConfigProvider, Switch } from 'antd';
import { Shield } from "lucide-react";
import { useState, useEffect } from "react";

interface PollStepProps {
  formData: PollState;
  updateFormData: (name: string, value: any) => void;
}

export default function PollStep3({ formData, updateFormData }: PollStepProps) {
  const [isVisible, setIsVisible] = useState(formData.fundingType !== "unfunded");
  const [height, setHeight] = useState(formData.fundingType !== "unfunded" ? "auto" : "0");
  const [transform, setTransform] = useState(formData.fundingType !== "unfunded" ? "translateY(0)" : "translateY(-10px)");

  useEffect(() => {
    if (formData.fundingType === "unfunded") {
      setTransform("translateY(-10px)");
      setIsVisible(false);
      setTimeout(() => setHeight("0"), 400);
    } else {
      setHeight("auto");
      setTimeout(() => {
        setIsVisible(true);
        setTransform("translateY(0)");
      }, 50);
    }
  }, [formData.fundingType]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Poll Settings
        </CardTitle>
        <CardDescription>Configure funding, rewards, and response limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>How will the poll be funded? *</Label>
          <RadioGroup
            value={formData.fundingType}
            onValueChange={(value) => {
              if (value === "crowdfunded") {
                updateFormData("openImmediately", false)
              } else if (value === "unfunded") {
                updateFormData("openImmediately", true)
              }
              updateFormData("fundingType", value)
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="self-funded" id="self-funded" />
              <Label htmlFor="self-funded">Self-funded (I'll fund the rewards)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="crowdfunded" id="crowdfunded" />
              <Label htmlFor="crowdfunded">Crowdfunded (Participants fund the rewards)</Label>
            </div>
            {/* <div className="flex items-center space-x-2">
              <RadioGroupItem value="unfunded" id="unfunded" />
              <Label htmlFor="unfunded">Unfunded (No rewards for participants)</Label>
            </div> */}
          </RadioGroup>
        </div>

        <div className="flex items-center space-x-2">
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: "#000"
              },
            }}
          >
            <Switch
              id="open-immediately"
              disabled={formData.fundingType === "crowdfunded"}
              checked={formData.openImmediately}
              className="text-white"
              onChange={(checked) => updateFormData("openImmediately", checked)}
              checkedChildren="Y" unCheckedChildren="N"
            />
          </ConfigProvider>
          <Label htmlFor="open-immediately">Open poll immediately after creation</Label>
        </div>

        <div 
          className="transition-all duration-500 ease-in-out overflow-hidden"
          style={{ 
            opacity: isVisible ? 1 : 0,
            height: height,
            transform: transform,
            transition: 'opacity 500ms ease-in-out, transform 500ms ease-in-out, height 500ms ease-in-out',
            pointerEvents: isVisible ? 'auto' : 'none'
          }}
        >
          <div className="space-y-4">
            <Label>How will responders be rewarded? *</Label>
            <RadioGroup
              value={formData.rewardDistribution}
              onValueChange={(value) => updateFormData("rewardDistribution", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="split" id="split" />
                <Label htmlFor="split">Split total funds equally among all responders</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed">Fixed amount per responder</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.rewardDistribution === "split" ? (
            <div className="space-y-2">
              <Label htmlFor="target-fund">Target Fund Amount (NERO) *</Label>
              <Input
                id="target-fund"
                type="number"
                step="0.001"
                placeholder="1.0"
                min="0"
                value={formData.targetFund}
                onChange={(e) => updateFormData("targetFund", e.target.value)}
                required={formData.fundingType === "unfunded" ? false : true}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="fixed-reward">Fixed Reward per Responder (NERO) *</Label>
              <Input
                id="fixed-reward"
                type="number"
                step="0.001"
                placeholder="0.01"
                min="0"
                value={formData.rewardPerResponse}
                onChange={(e) => updateFormData("rewardPerResponse", e.target.value)}
                required={formData.fundingType === "unfunded" ? false : true}
              />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="response-limit">Target Number of Responses</Label>
          <Input
            id="response-limit"
            type="number"
            placeholder="100"
            min="1"
            value={formData.maxResponses}
            onChange={(e) => updateFormData("maxResponses", e.target.value)}
          />
          <p className="text-sm text-muted-foreground">Leave empty for unlimited responses</p>
        </div>
        <div className="space-y-4">
          <Label>Vote Weight? *</Label>
          <RadioGroup
            value={formData.voteWeight}
            onValueChange={(value) => updateFormData("voteWeight", value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="simple" id="simple" />
              <Label htmlFor="simple">One Vote Per Address (one-to-one)</Label>
            </div>
            {/* <div className="flex items-center space-x-2">
              <RadioGroupItem value="weighted" id="weighted" />
              <Label htmlFor="weighted">One Vote Per Address (Weighted)</Label>
            </div> */}
            {/* <div className="flex items-center space-x-2">
              <RadioGroupItem value="multiple-simple" id="multiple-simple" />
              <Label htmlFor="multiple-simple">Multiple Votes Per Address (one-to-one)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="multiple-weighted" id="multiple-weighted" />
              <Label htmlFor="multiple-weighted">Multiple Votes Per Address (weighted)</Label>
            </div> */}
            {/* <div className="flex items-center space-x-2">
              <RadioGroupItem value="quadratic" id="quadratic" />
              <Label htmlFor="quadratic">Quadratic (Beta)</Label>
            </div> */}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}