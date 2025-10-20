# TODO - Bug Fixes

## High Priority Bugs

### 1. AI-Generated First Option Vote Transaction Issue
**Problem:** When creating options with AI, the first option generated doesn't enable the vote to send the transactions for some reason.

**Status:** 🔴 Not Started  
**Priority:** High  
**Assignee:** TBD  

---

### 2. Poll Refund Logic for Canceled Polls
**Problem:** When canceling a poll and trying to refund, the transaction fails saying "the poll is not closed". Probably when a poll is canceled, the status goes to canceled instead of closed. The refund logic should consider canceled OR closed.

**Status:** 🟢 Completed
**Priority:** High
**Assignee:** Claude Code

**Technical Notes:**
- ✅ Smart contract already accepts both "canceled" and "closed" statuses (FundingManager.sol:191-193)
- ✅ Bug was in frontend UI at completed-polls.tsx:220 - conditional rendering only showed refund button for "cancelled" polls
- ✅ Fixed by always showing refund button for both "closed" and "cancelled" polls
- ✅ "View Result" button still conditionally shown only for "closed" polls

**Fix Applied:**
- File: `/src/pages/admin/content/completed-polls.tsx` (lines 220-253)
- Removed ternary operator that prevented refund button from showing on "closed" polls
- Now both poll statuses can access refund functionality as intended by contract logic

---

## Medium Priority Features

### 3. Super Admin Dashboard for Poll Fund Tracking
**Problem:** As the contract deployer, I want a super admin page to keep track of each poll to see which polls has still remaining funds so that I can manually trigger the manual refund to the poll creator.

**Status:** 🔴 Not Started  
**Priority:** Medium  
**Assignee:** TBD  

**Requirements:**
- Admin-only access page
- List all polls with their current fund status
- Show remaining funds for each poll
- Manual refund trigger functionality
- Filter/search capabilities for polls

---

## Legend
- 🔴 Not Started
- 🟡 In Progress  
- 🟢 Completed
- 🔵 Testing
- ⚫ Blocked