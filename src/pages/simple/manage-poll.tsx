"use client"

import { useEffect, useState } from "react"
import { DatePicker, DatePickerProps, Switch } from "antd";
import { Button, Form, Input, Card, Space } from 'antd';
import { Steps } from 'antd';
import dayjs from 'dayjs';

interface ManagePollProps {
  poll: any;
  handleUpdatePoll: (pollData: any) => Promise<void>;
}

interface PollOption {
  id: number;
  key: number;
  text: string;
}

const onChange: DatePickerProps['onChange'] = (date, dateString) => {
  console.log(date, dateString);
};

export default function ManagePoll({ poll, handleUpdatePoll }: ManagePollProps) {
   const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  const [options, setOptions] = useState<PollOption[]>([]);
  
  useEffect(() => {
    const modOptions: PollOption[] = [];
    poll.options.forEach((element: string, index: number) => {
      modOptions.push({ id: index, key: index, text: element });
    });
    setOptions(modOptions);
  }, []); 

  const modPollForForm = {
    subject: poll.subject,
    description: poll.description,
    endDate: poll.endDate,
  }

  const [current, setCurrent] = useState(0);
  const steps = [
    { title: 'Basic Info' },
    { title: 'Settings'}
  ];

  const next = async () => {
    setCurrent(current + 1);
  };

  const prev = async () => {
    setCurrent(current - 1);
  };

  const handleUpdatePollLocal = async () => {
    setIsLoading(true);
    try {
      await form.validateFields();
      const fieldsValue = form.getFieldsValue(true);

      // Calculate duration in days
      const endDate = fieldsValue.endDate?.toDate();
      const currentDate = new Date();
      const durationInMs = endDate.getTime() - currentDate.getTime();
      const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));

      const pollData = {
        ...fieldsValue,
        id: poll.id,
        options: poll.options,
        endDate: endDate,
        duration: durationInDays // Add the calculated duration
      };
      await handleUpdatePoll(pollData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Form
        layout={"horizontal"}
        form={form}
        name="basicInfo"
        style={{ maxWidth: 600, margin: '0 auto' }}
        initialValues={modPollForForm}
      >

        <Steps
          current={current}
          percent={current / (steps.length - 1) * 100}
          items={steps}
        />
        {/* <div style={contentStyle}>{stepItems[current].content}</div> */}
        <Card
          style={current == 0 ? {} : { display: "none" }}
        >
          <Form.Item 
            label="Subject"
            name="subject"
            rules={[{ required: true, message: 'Please enter a subject' }]}
            style={{ textAlign: 'center' }}
          >
            <Input placeholder="Subject" />
          </Form.Item>
          <Form.Item 
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter a description' }]}
            style={{ textAlign: 'center' }}
          >
            <Input placeholder="Enter poll description" />
          </Form.Item>
          <Form.Item 
            label="End Date"
            name="endDate"
            rules={[{ required: true, message: 'Please select an end date' }]}
            style={{ textAlign: 'center' }}
          >
            <DatePicker
              onChange={onChange}
              picker="date"
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
              disabledDate={(current) => {
                return current && current < dayjs().endOf('day');
              }}
            />
          </Form.Item>
          <Form.Item 
            label="Is Open"
            name="isOpen"
            style={{ textAlign: 'center' }}
          >
            <Switch disabled checkedChildren="Open" unCheckedChildren="Closed" defaultChecked={poll.isOpen} />
          </Form.Item>
        </Card>

        {/* Settings */}
        <Card
          style={current == 1 ? {} : { display: "none" }}
        >
          <Form.Item 
            label="Reward per Response"
            name="rewardPerResponse"
            rules={[
              { required: true, message: 'Please enter reward amount' },
            ]}
            style={{ textAlign: 'center' }}
          >
            <Input type="number" placeholder="Enter reward amount" />
          </Form.Item>
          <Form.Item 
            label="Max Responses"
            name="maxResponses"
            rules={[
              { required: true, message: 'Please enter max responses' },
            ]}
            style={{ textAlign: 'center' }}
          >
            <Input type="number" placeholder="Enter maximum number of responses" />
          </Form.Item>
          <Form.Item 
            label="Min Contribution"
            name="minContribution"
            rules={[
              { required: true, message: 'Please enter minimum contribution' },
            ]}
            style={{ textAlign: 'center' }}
          >
            <Input type="number" placeholder="Enter minimum contribution amount" />
          </Form.Item>
          <Form.Item 
            label="Target Fund"
            name="targetFund"
            rules={[
              { required: true, message: 'Please enter target fund' },
            ]}
            style={{ textAlign: 'center' }}
          >
            <Input type="number" placeholder="Enter target fund amount" />
          </Form.Item>
        </Card>

        <div style={{ marginTop: 24 }}>
          {current > 0 && (
            <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
              Previous
            </Button>
          )}
          {current < steps.length - 1 && (
            <Button type="primary" onClick={() => next()}>
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button
            type="primary"
            onClick={handleUpdatePollLocal}
            loading={isLoading}
            >
              Submit
            </Button>
          )}
        </div>
      </Form>
    </div>
  )
}