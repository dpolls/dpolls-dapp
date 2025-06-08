export const ERC20_ABI = [
  // Read-Only Functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',

  // Authenticated Functions
  'function transfer(address to, uint amount) returns (bool)',
  'function transferFrom(address from, address to, uint amount) returns (bool)',
  'function approve(address spender, uint amount) returns (bool)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint amount)',
]

export const POLLS_DAPP_ABI = [
  // Poll Creation and Management
  'function createPoll(tuple(address creator, string subject, string description, string category, string viewType, string[] options, uint256 rewardPerResponse, uint256 durationDays, uint256 maxResponses, uint256 minContribution, string fundingType, bool isOpenImmediately, uint256 targetFund, address rewardToken, string rewardDistribution) params) external payable',
  'function submitResponse(uint256 pollId, string response) external payable',
  'function closePoll(uint256 pollId) external payable',
  'function cancelPoll(uint256 pollId) external payable',
  'function openPoll(uint256 pollId) external payable',
  'function forClaiming(uint256 pollId) external payable',
  'function forFunding(uint256 pollId) external payable',
  'function updateTargetFund(uint256 pollId, uint256 newTargetFund) external payable',
  'function fundPoll(uint256 pollId) external payable',
  'function fundPollWithToken(uint256 pollId, uint256 amount) external',
  'function claimReward(uint256 pollId) external payable',
  
  // View Functions
  'function getOptions(uint256 pollId) view returns (string[])',
  'function getPollStatus(uint256 pollId) view returns (bool, uint256, uint256)',
  'function getAllPollIds() view returns (uint256[])',
  'function getPoll(uint256 pollId) view returns (tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, bool isOpen, uint256 totalResponses, uint256 funds, address rewardToken, string rewardDistribution))',
  'function getPollResponses(uint256 pollId) view returns (tuple(address responder, string response, uint256 weight, uint256 timestamp, bool isClaimed, uint256 reward)[])',
  'function getUserPolls(address user) view returns (tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, bool isOpen, uint256 totalResponses, uint256 funds, address rewardToken, string rewardDistribution)[])',
  'function getUserActivePolls(address user) view returns (tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, bool isOpen, uint256 totalResponses, uint256 funds, address rewardToken, string rewardDistribution)[])',
  'function getActivePolls() view returns (tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, bool isOpen, uint256 totalResponses, uint256 funds, address rewardToken, string rewardDistribution)[])',
  
  // Events
  'event PollCreated(uint256 pollId, address creator, string subject)',
  'event PollUpdated(uint256 pollId, address creator, string sub)',
  'event PollClosed(uint256 pollId)',
  'event TargetFundUpdated(uint256 pollId, uint256 oldTarget, uint256 newTarget)'
]

export const ERC721_ABI = [
  // Read-Only Functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',

  // Authenticated Functions
  'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) returns (bool)',
  'function safeTransferFrom(address from, address to, uint256 tokenId) returns (bool)',
  'function transferFrom(address from, address to, uint256 tokenId) returns (bool)',
  'function approve(address to, uint256 tokenId) returns (bool)',
  'function setApprovalForAll(address operator, bool approved) returns (bool)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
]
