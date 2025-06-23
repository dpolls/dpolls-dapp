# AI Chat Feature for dPolls

## Overview

The AI Chat feature allows users to create polls using natural language prompts. Users can describe what kind of poll they want to create, and the AI will generate a complete poll with appropriate settings. The generated polls are saved to MongoDB and automatically registered on the blockchain via a cron job.

## Features

- **Floating Chat Button**: A floating chat button appears on all pages in the bottom-right corner
- **AI-Powered Poll Generation**: Users can input natural language prompts to describe their desired poll
- **MongoDB Storage**: AI-generated polls are saved to MongoDB for processing
- **Automatic Registration**: Cron job automatically registers pending polls on the blockchain
- **Default Settings**: AI-generated polls use sensible default settings for duration, rewards, and funding
- **Real-time Chat Interface**: Interactive chat interface with message history

## How to Use

1. **Access the Chat**: Click the floating chat button (bot icon) in the bottom-right corner of any page
2. **Describe Your Poll**: Type a natural language description of the poll you want to create
   - Example: "Create a poll about favorite programming languages"
   - Example: "I want to know what people think about sustainable energy solutions"
3. **AI Generation**: The AI will analyze your prompt and generate:
   - Poll subject/title
   - Description
   - Category
   - Poll options
   - Default settings (duration, rewards, funding)
4. **Automatic Processing**: The generated poll is saved to MongoDB and will be automatically registered on the blockchain within 1 minute

## API Endpoint

The feature uses a new API endpoint: `POST /api/poll-ai`

### Request Format
```json
{
  "prompt": "Create a poll about favorite programming languages"
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    "poll": {
      "subject": "Favorite Programming Languages",
      "description": "Which programming language do you prefer for development?",
      "category": "tech",
      "viewType": "text",
      "options": ["JavaScript", "Python", "Java", "C++"],
      "rewardPerResponse": "0.001",
      "durationDays": 7,
      "maxResponses": 100,
      "minContribution": "0.0001",
      "fundingType": "self-funded",
      "isOpenImmediately": true,
      "targetFund": "0.1",
      "rewardToken": "0x0000000000000000000000000000000000000000",
      "rewardDistribution": "split"
    },
    "message": "Successfully generated poll: \"Favorite Programming Languages\"",
    "mongoId": "507f1f77bcf86cd799439011"
  }
}
```

## MongoDB Schema

AI-generated polls are stored in the `ai-generated-polls` collection with the following schema:

```javascript
{
  subject: String,           // Poll title
  description: String,       // Poll description
  category: String,          // Poll category
  viewType: String,          // 'text' or 'gallery'
  options: [String],         // Array of poll options
  rewardPerResponse: String, // ETH amount per response
  durationDays: Number,      // Poll duration in days
  maxResponses: Number,      // Maximum number of responses
  minContribution: String,   // Minimum contribution amount
  fundingType: String,       // 'self-funded', 'crowdfunded', or 'unfunded'
  isOpenImmediately: Boolean, // Whether poll opens immediately
  targetFund: String,        // Target funding amount
  rewardToken: String,       // Token address for rewards
  rewardDistribution: String, // 'split', 'fixed', or 'none'
  originalPrompt: String,    // Original user prompt
  status: String,            // 'pending', 'registered', or 'failed'
  blockchainPollId: Number,  // Blockchain poll ID after registration
  registrationAttempts: Number, // Number of registration attempts
  lastRegistrationAttempt: Date, // Last attempt timestamp
  errorMessage: String,      // Error message if registration failed
  createdAt: Date,           // Creation timestamp
  updatedAt: Date            // Last update timestamp
}
```

## Default Settings

AI-generated polls use the following default settings:

- **Duration**: 7 days
- **Max Responses**: 100
- **Reward per Response**: 0.001 ETH
- **Min Contribution**: 0.0001 ETH
- **Target Fund**: 0.1 ETH
- **Funding Type**: Self-funded
- **View Type**: Text
- **Reward Distribution**: Split
- **Status**: Open immediately

## Cron Job - Automatic Poll Registration

The `registerAiGeneratedPolls()` cron job runs every minute and:

1. **Queries MongoDB** for polls with status 'pending' and less than 3 registration attempts
2. **Processes up to 5 polls** per execution to avoid overwhelming the blockchain
3. **Attempts to register** each poll on the blockchain using the contract's `createPoll` function
4. **Updates poll status** to 'registered' on success or 'failed' after 3 failed attempts
5. **Tracks blockchain poll ID** and error messages for debugging

### Cron Job Configuration

- **Frequency**: Every minute (`* * * * *`)
- **Max Attempts**: 3 per poll
- **Batch Size**: 5 polls per execution
- **Error Handling**: Comprehensive error tracking and logging

## Technical Implementation

### Frontend Components

1. **FloatingChatButton** (`src/components/ui_v3/floating-chat-button.tsx`)
   - Floating button that appears on all pages
   - Toggles the chat modal

2. **AIChatModal** (`src/components/modals/ai-chat-modal.tsx`)
   - Chat interface with message history
   - Handles API communication
   - Displays generated poll preview

### Backend Implementation

1. **Controller** (`dpolls-api/src/controllers/pollController.js`)
   - `generatePollWithAI()` method handles poll generation requests
   - Saves generated polls to MongoDB

2. **Route** (`dpolls-api/src/routes/pollRoutes.js`)
   - `POST /api/poll-ai` endpoint

3. **AI Service** (`dpolls-api/src/services/openaiService.js`)
   - Uses OpenAI to generate poll components
   - Determines category, subject, description, and options

4. **MongoDB Model** (`dpolls-api/src/models/AiGeneratedPoll.js`)
   - Mongoose schema for AI-generated polls
   - Includes validation and indexing

### Cron Service Implementation

1. **Cron Service** (`dpolls-cron/src/services/cronService.js`)
   - `registerAiGeneratedPolls()` function for automatic registration
   - `startAiPollRegistrationCron()` for scheduling

2. **Database Connection** (`dpolls-cron/src/config/database.js`)
   - MongoDB connection management for cron service

## Setup Requirements

1. **OpenAI API Key**: Must be configured in the backend environment
2. **MongoDB**: Must be running and accessible
3. **Backend Server**: API server must be running on port 3000
4. **Cron Service**: Must be running for automatic poll registration
5. **Frontend Proxy**: Vite proxy configuration routes `/api` calls to backend
6. **Blockchain**: Contract must be deployed and accessible

## Environment Variables

### API Service
```bash
OPENAI_API_KEY=your_openai_api_key
MONGODB_URI=mongodb://localhost:27017/dpolls-ai
PORT=3000
```

### Cron Service
```bash
MONGODB_URI=mongodb://localhost:27017/dpolls-ai
RPC_URL=your_blockchain_rpc_url
PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=your_contract_address
```

## Development

### Running the Backend
```bash
cd dpolls-api
npm install
npm run dev
```

### Running the Cron Service
```bash
cd dpolls-cron
npm install
npm start
```

### Running the Frontend
```bash
cd dpolls-dapp
npm install
npm run dev
```

### Testing

#### Test API Endpoint
```bash
cd dpolls-api
node test-poll-ai-endpoint.js
```

#### Test MongoDB Integration
```bash
cd dpolls-api
node test-mongodb-integration.js
```

## Future Enhancements

- Allow users to customize generated poll settings
- Add support for different poll types (image polls, etc.)
- Implement poll creation directly from the chat interface
- Add conversation memory for better context
- Support for multiple languages
- Real-time status updates for poll registration
- User notification system for registration status
- Poll analytics and performance tracking 