"use client"

import { DatePicker, Select, Switch, InputNumber } from "antd";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v3/card";
import { Input } from "@/components/ui_v3/input";
import { Label } from "@/components/ui_v3/label";
import { Textarea } from "@/components/ui_v3/textarea";
import { PollState } from "@/types/poll";
import { Calendar, Sparkles } from "lucide-react";
import dayjs from 'dayjs';
import { getTagColor } from "@/utils/tagColors";

const { Option } = Select;

interface PollStepProps {
  formData: PollState;
  updateFormData: (name: string, value: any) => void;
}

export default function PollStep1({ formData, updateFormData }: PollStepProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Poll Content
        </CardTitle>
        <CardDescription>Define your poll question, description, and timing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="subject">Poll Question/Topic *</Label>
          <Input
            id="subject"
            placeholder="What question do you want to ask?"
            value={formData.subject}
            onChange={(e) => updateFormData("subject", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Provide context and details about your poll"
            rows={4}
            value={formData.description}
            onChange={(e) => updateFormData("description", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
              placeholder="Select a category"
              allowClear
              onChange={(value) => updateFormData("category", value)}
              style={{ width: "100%" }}
              value={formData.category}
            >
              <Option value="art" style={{ color: getTagColor('category', 'art') }}>Art</Option>
              <Option value="design" style={{ color: getTagColor('category', 'design') }}>Design</Option>
              <Option value="tech" style={{ color: getTagColor('category', 'tech') }}>Technology</Option>
              <Option value="defi" style={{ color: getTagColor('category', 'defi') }}>DeFi</Option>
              <Option value="lifestyle" style={{ color: getTagColor('category', 'lifestyle') }}>Lifestyle</Option>
              <Option value="environment" style={{ color: getTagColor('category', 'environment') }}>Environment</Option>
              <Option value="web3" style={{ color: getTagColor('category', 'web3') }}>Web3</Option>
              <Option value="food" style={{ color: getTagColor('category', 'food') }}>Food</Option>
              <Option value="other" style={{ color: getTagColor('category', 'other') }}>Other</Option>
            </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="voting-duration">Voting Period (days) *</Label>
          {/* <Input
            id="voting-duration"
            type="number"
            placeholder="3"
            min="1"
            value={formData.duration}
            onChange={(e) => updateFormData("duration", e.target.value)}
            required
          /> */}
          <DatePicker
            onChange={(endDatePicker) => {
              console.log("typeof endDate", typeof endDatePicker)
              const currentDate = new Date();
              const durationInMs = endDatePicker?.toDate().getTime() - currentDate.getTime();
              const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));
              updateFormData("duration", durationInDays)
              updateFormData("endDate", endDatePicker)
            }}
            value={formData.endDate}
            picker="date"
            format="YYYY-MM-DD"
            style={{ width: '100%' }}
            disabledDate={(current) => {
              return current && current < dayjs().endOf('day');
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Use AI to generate options
            </Label>
            <Switch
              checked={formData.useAI}
              onChange={(checked) => updateFormData("useAI", checked)}
            />
          </div>
          {formData.useAI && (
              <div className="space-y-2">
                <Label htmlFor="num-options">Number of options to generate</Label>
                <InputNumber
                  id="num-options"
                  min={2}
                  max={10}
                  defaultValue={formData.numOptions}
                  onChange={(value) => updateFormData("numOptions", value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}