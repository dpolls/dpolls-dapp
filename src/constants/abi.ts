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

export const POLLS_DAPP_ABI = [
  'constructor(address _tokenManager, address _fundingManager, address _responseManager, address _pollManager)',
  // Fns
  'function deposit() payable',
  'function createPoll(tuple(address creator, string subject, string description, string category, string viewType, string[] options, uint256 rewardPerResponse, uint256 durationDays, uint256 maxResponses, uint256 minContribution, string fundingType, bool isOpenImmediately, uint256 targetFund, address rewardToken, string rewardDistribution) params) payable',
  'function submitResponse(uint256 pollId, string response) payable',
  'function closePoll(uint256 pollId) payable',
  'function cancelPoll(uint256 pollId) payable',
  'function openPoll(uint256 pollId) payable',
  'function forClaiming(uint256 pollId) payable',
  'function forFunding(uint256 pollId) payable',
  'function updateTargetFund(uint256 pollId, uint256 newTargetFund) payable',
  'function fundPoll(uint256 pollId) payable',
  'function fundPollWithToken(uint256 pollId, uint256 amount)',
  'function claimReward(uint256 pollId) payable',
  'function donateReward(uint256 pollId) payable',
  'function donateRemainingFunds(uint256 pollId) payable',
  'function claimRemainingFunds(uint256 pollId) payable',
  // Views
  'function getCommunityFundBalance(address token) view returns (uint256)',
  'function getDonorTotalByToken(address donor, address token) view returns (uint256)',
  'function getDonorHistory(address donor) view returns (tuple(address token, uint256 amount, uint256 timestamp, string donationType, uint256 pollId)[])',
  'function getOptions(uint256 pollId) view returns (string[])',
  'function getPollStatus(uint256 pollId) view returns (bool, uint256, uint256)',
  'function getAllPollIds() view returns (uint256[])',
  'function getPoll(uint256 pollId) view returns (tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, bool isOpen, uint256 totalResponses, uint256 funds, address rewardToken, string rewardDistribution))',
  'function getPollWithoutOptions(uint256 pollId) view returns (tuple(address creator, string subject, string description, string category, string status, string viewType, uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, bool isOpen, uint256 totalResponses, uint256 funds, address rewardToken, string rewardDistribution))',
  'function getPollResponses(uint256 pollId) view returns (tuple(address responder, string response, uint256 weight, uint256 timestamp, bool isClaimed, uint256 reward)[])',
  'function getActivePolls() view returns (tuple(tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, bool isOpen) content, tuple(uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, uint256 funds, address rewardToken, string rewardDistribution) settings)[])',
  // Events
  'event PollCreated(uint256 pollId, address creator, string subject)',
  'event PollUpdated(uint256 pollId, address creator, string sub)',
  'event PollClosed(uint256 pollId)',
  'event TargetFundUpdated(uint256 pollId, uint256 oldTarget, uint256 newTarget)',
  'event RewardDonated(uint256 pollId, address user, uint256 amount)',
  'event RemainingFundsDonated(uint256 pollId, uint256 amount)',
  'event RemainingFundsClaimed(uint256 pollId, address creator, uint256 amount)',
]

export const POLL_MANAGER_ABI = [
  'constructor(address _responseManager, address _fundingManager)',
  'function validateCreatePollParams(string[] options, uint256 durationDays, uint256 minContribution, uint256 targetFund, uint256 rewardPerResponse, uint256 maxResponses)',
  'function createPoll(tuple(address creator, string subject, string description, string category, string viewType, string[] options, uint256 rewardPerResponse, uint256 durationDays, uint256 maxResponses, uint256 minContribution, string fundingType, bool isOpenImmediately, uint256 targetFund, address rewardToken, string rewardDistribution) params) returns (uint256)',
  'function createUnfundedPoll(tuple(address creator, string subject, string description, string category, string viewType, string[] options, uint256 durationDays, bool isOpenImmediately) params) returns (uint256)',
  'function closePoll(uint256 pollId, address caller, uint256 responseCount)',
  'function cancelPoll(uint256 pollId, address caller)',
  'function openPoll(uint256 pollId, address caller)',
  'function forClaiming(uint256 pollId, address caller)',
  'function forFunding(uint256 pollId, address caller)',
  'function getPollSubject(uint256 pollId) view returns (string)',
  'function getOptions(uint256 pollId) view returns (string[])',
  'function getPollStatus(uint256 pollId) view returns (bool, uint256, uint256)',
  'function getAllPollIds() view returns (uint256[])',
  'function getPoll(uint256 pollId) view returns (tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, bool isOpen, uint256 totalResponses, uint256 funds, address rewardToken, string rewardDistribution))',
  'function getPollWithoutOptions(uint256 pollId) view returns (tuple(address creator, string subject, string description, string category, string status, string viewType, uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, bool isOpen, uint256 totalResponses, uint256 funds, address rewardToken, string rewardDistribution))',
  'function getUserPolls(address user) view returns (tuple(tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, bool isOpen) content, tuple(uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, uint256 funds, address rewardToken, string rewardDistribution) settings)[])',
  'function getUserActivePolls(address user) view returns (tuple(tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, bool isOpen) content, tuple(uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, uint256 funds, address rewardToken, string rewardDistribution) settings)[])',
  'function getActivePolls() view returns (tuple(tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, bool isOpen) content, tuple(uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, uint256 funds, address rewardToken, string rewardDistribution) settings)[])',
]

export const FUNDING_MANAGER_ABI = [
  'constructor(address _tokenManager)',
  // Fns
  'function validateFunding(address rewardToken, bool isOpenImmediately, uint256 targetFund, uint256 value, string fundingType)',
  'function handleImmediateFunding(uint256 pollId, uint256 amount)',
  'function updateTargetFund(uint256 pollId, uint256 newTargetFund, address caller, tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, bool isOpen, uint256 totalResponses, uint256 funds, address rewardToken, string rewardDistribution) poll) returns (uint256)',
  'function fundPoll(uint256 pollId, uint256 amount, tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, bool isOpen, uint256 totalResponses, uint256 funds, address rewardToken, string rewardDistribution) poll)',
  'function fundPollWithToken(uint256 pollId, uint256 amount, address caller, tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, bool isOpen, uint256 totalResponses, uint256 funds, address rewardToken, string rewardDistribution) poll)',
  'function donateRewardToCommunity(uint256 pollId, address user, uint256 amount, tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, bool isOpen, uint256 totalResponses, uint256 funds, address rewardToken, string rewardDistribution) poll)',
  'function donateRemainingFunds(uint256 pollId, address caller, tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, bool isOpen, uint256 totalResponses, uint256 funds, address rewardToken, string rewardDistribution) poll)',
  'function claimRemainingFunds(uint256 pollId, address caller, tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, bool isOpen, uint256 totalResponses, uint256 funds, address rewardToken, string rewardDistribution) poll)',
  // Views
  'function getCommunityFundBalance(address token) view returns (uint256)',
  'function getDonorTotalByToken(address donor, address token) view returns (uint256)',
  'function getDonorHistory(address donor) view returns (tuple(address token, uint256 amount, uint256 timestamp, string donationType, uint256 pollId)[])',
  // Events
  'event CommunityFundDonation(address token, uint256 amount)',
  'event RemainingFundsDonated(uint256 pollId, address token, uint256 amount)',
  'event DonationRecorded(address donor, address token, uint256 amount, string donationType, uint256 pollId)',
]

export const RESPONSE_MANAGER_ABI = [
  'function submitResponse(uint256 pollId, address responder, string response, tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, bool isOpen, uint256 totalResponses, uint256 funds, address rewardToken, string rewardDistribution) poll)',
  'function getPollResponses(uint256 pollId) view returns (tuple(address responder, string response, uint256 weight, uint256 timestamp, bool isClaimed, uint256 reward)[])',
  'function calculateReward(uint256 pollId, address caller, uint256 pollFunds, uint256 totalResponses, tuple(address creator, string subject, string description, string category, string status, string viewType, string[] options, uint256 rewardPerResponse, uint256 maxResponses, uint256 durationDays, uint256 minContribution, string fundingType, uint256 targetFund, uint256 endTime, bool isOpen, uint256 totalResponses, uint256 funds, address rewardToken, string rewardDistribution) poll) view returns (uint256)',
  'function markResponsesAsClaimed(uint256 pollId, address responder)',
]

export const TOKEN_MANAGER_ABI = [
  'constructor()',
  'function whitelistToken(address token)',
  'function removeToken(address token)',
  'function setNativeToken(address token)',
  'function isTokenWhitelisted(address token) view returns (bool)',
  'function getNativeToken() view returns (address)',
  'event TokenWhitelisted(address token)',
  'event TokenRemoved(address token)',
  'event NativeTokenSet(address token)',
]
