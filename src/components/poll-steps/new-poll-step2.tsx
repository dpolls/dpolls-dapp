"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui_v3/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v3/card";
import { Input } from "@/components/ui_v3/input";
import { Label } from "@/components/ui_v3/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui_v3/radio-group";
import { PollState } from "@/types/poll";
import { Plus, Trash2, Upload, Users } from "lucide-react";
import dpollsConfig from '@/../dpolls.config'
import GeneratingOptions from "@/components/poll-steps/generating-options";

interface PollStepProps {
  formData: PollState;
  updateFormData: (name: string, value: any) => void;
}

export default function PollStep2({ formData, updateFormData }: PollStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateOptions = async () => {
    if (formData.useAI) {
      setIsGenerating(true);
      try {
        const response = await fetch(`${dpollsConfig.api}/api/poll-options`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: formData.subject,
            category: formData.category,
            numOptions: formData.numOptions || 2
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate options');
        }

        const resp = await response.json();
        updateFormData("options", resp.data.options || []);
      } catch (error) {
        console.error('Error generating options:', error);
        // Fallback to empty options if generation fails
        updateFormData("options", []);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  useEffect(() => {
    if (formData.useAI && formData.options.length === 0) {
      generateOptions();
    }
  }, [formData.useAI, formData.subject, formData.options]);

  const addOption = () => {
    updateFormData("options", [...formData.options, ""])
    updateFormData("numOptions", formData.numOptions + 1)
  }

  const removeOption = (index: number) => {
    const newOptions = formData.options.filter((_, i) => i !== index)
    updateFormData("options", newOptions)
    updateFormData("numOptions", newOptions.length)
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    updateFormData("options", newOptions)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Poll Options
        </CardTitle>
        <CardDescription>Configure your poll choices and display type</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Poll Display Type</Label>
          <RadioGroup value={formData.viewType} onValueChange={(value) => updateFormData("viewType", value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="text" id="text" />
              <Label htmlFor="text">Text-based poll</Label>
            </div>
            {/* <div className="flex items-center space-x-2">
              <RadioGroupItem value="gallery" id="gallery" />
              <Label htmlFor="gallery">Gallery view (images/media)</Label>
            </div> */}
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <Label>Poll Options *</Label>
            {formData.useAI && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={generateOptions}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                Regenerate Options
              </Button>
            )}
          </div>
          {isGenerating ? (
            <div className="text-center py-4">
              <GeneratingOptions isLoading={isGenerating} />
            </div>
          ) : (
            <>
              {formData.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      required
                    />
                  </div>
                  {formData.viewType === "gallery" && (
                    <Button type="button" variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="icon" onClick={() => removeOption(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addOption} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}