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
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { POLLS_DAPP_ABI } from "@/constants/abi";
import { useConfig, useSignature } from "@/hooks";

const { Option } = Select;

interface PollStepProps {
  formData: PollState;
  updateFormData: (name: string, value: any) => void;
}

export default function PollStep1({ formData, updateFormData }: PollStepProps) {
  const [projects, setProjects] = useState<Array<{ id: string; owner: string; isOwned: boolean }>>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const config = useConfig();
  const { AAaddress } = useSignature();

  // Check if today is the end of the month
  const today = dayjs();
  const isEndOfMonth = today.date() === today.daysInMonth();

  // Convert formData.endDate to dayjs if it exists, otherwise use null
  const defaultDate = formData.endDate && formData.endDate instanceof Date
    ? dayjs(formData.endDate)
    : null;

  // Set default picker value to next month if today is end of month
  const defaultPickerValue = isEndOfMonth ? today.add(1, 'month').startOf('month') : undefined;

  // Fetch available projects
  useEffect(() => {
    if (AAaddress && config?.chains[config?.currentNetworkIndex]?.dpolls?.contractAddress) {
      fetchProjects();
    }
  }, [AAaddress, config]);

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);

      const provider = new ethers.providers.JsonRpcProvider(
        config.chains[config.currentNetworkIndex].chain.rpc
      );

      const pollsContract = new ethers.Contract(
        config.chains[config.currentNetworkIndex].dpolls.contractAddress,
        POLLS_DAPP_ABI,
        provider
      );

      const allProjectIds = await pollsContract.getAllProjects();

      if (allProjectIds.length > 0) {
        const projectsWithOwnership = await Promise.all(
          allProjectIds.map(async (projectId: string) => {
            const owner = await pollsContract.getProjectOwner(projectId);
            return {
              id: projectId,
              owner,
              isOwned: owner.toLowerCase() === AAaddress.toLowerCase()
            };
          })
        );

        setProjects(projectsWithOwnership);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

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
          <Label htmlFor="project">Project *</Label>
          <Select
            placeholder="Select a project (only projects you own)"
            allowClear
            onChange={(value) => updateFormData("projectId", value)}
            style={{ width: "100%" }}
            value={formData.projectId}
            loading={loadingProjects}
            notFoundContent={loadingProjects ? "Loading projects..." : "No projects available"}
          >
            {projects.filter(p => p.isOwned).map((project) => (
              <Option key={project.id} value={project.id}>
                {project.id}
              </Option>
            ))}
          </Select>
          {projects.length === 0 && !loadingProjects && (
            <p className="text-xs text-muted-foreground">
              No projects found. Create a project first in the Projects tab.
            </p>
          )}
          {projects.filter(p => p.isOwned).length === 0 && projects.length > 0 && !loadingProjects && (
            <p className="text-xs text-muted-foreground">
              You don't own any projects. Only project owners can create polls.
            </p>
          )}
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
              const currentDate = new Date();
              const durationInMs = endDatePicker?.toDate().getTime() - currentDate.getTime();
              const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));
              updateFormData("duration", durationInDays)
              updateFormData("endDate", endDatePicker?.toDate())
            }}
            value={defaultDate}
            defaultPickerValue={defaultPickerValue}
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