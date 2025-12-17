# Mestring App - Development Roadmap

## ✅ COMPLETED PHASES

### Phase 1: Points System ✓

**Status:** Complete (Dec 12, 2025)

**Implemented:**

- ✅ PointsTransaction model in database
- ✅ Automatic point awarding on chore approval
- ✅ Points summary API (`/points/summary/:userId`)
- ✅ Leaderboard API (`/points/leaderboard/:familyId`)
- ✅ PointsSummary component showing total & weekly points
- ✅ Recent transaction history display

**Files:**

- `apps/api/prisma/schema.prisma` - PointsTransaction model
- `apps/api/src/routes/choreInstances.js` - Point awarding logic
- `apps/api/src/routes/points.js` - Points API endpoints
- `apps/web/src/features/points/PointsSummary.tsx` - Frontend display

---

### Phase 2: Calendar Views ✓

**Status:** Complete (Dec 17, 2025)

**Implemented:**

- ✅ react-big-calendar integration
- ✅ ChoreCalendar component with month/week/day/agenda views
- ✅ Color-coded events (pending/completed/approved)
- ✅ Weekly points summary with progress bar
- ✅ Click-to-complete/approve from calendar
- ✅ Mobile-responsive calendar styling
- ✅ Calendar legend for color meanings

**Files:**

- `apps/web/src/features/calendar/ChoreCalendar.tsx` - Calendar component
- `apps/web/src/styles/index.css` - Calendar custom styles
- `apps/web/src/App.tsx` - Calendar tab added

---

## 🚧 IN PROGRESS / PLANNED PHASES

### Phase 3: Dashboard Improvements

**Priority:** High (Foundation for better UX)
**Estimated Time:** 2-3 days

**Goals:**

- Create role-specific dashboard views
- Improve family overview
- Add quick stats and summaries

**Tasks:**

- [ ] Create `ParentDashboard.tsx` component
  - Overview of all children's chores
  - Pending approvals summary
  - Weekly family points overview
  - Quick actions (generate chores, create template)
- [ ] Create `ChildDashboard.tsx` component
  - Today's tasks overview
  - Points earned this week
  - Upcoming chores
  - Available rewards to claim
- [ ] Add dashboard route to App.tsx
  - Make it the default landing page
  - Show role-appropriate dashboard

- [ ] Create family members list component
  - Show all parents and children
  - Display each child's total points
  - Quick view of who has pending chores

**Files to Create:**

- `apps/web/src/features/dashboard/ParentDashboard.tsx`
- `apps/web/src/features/dashboard/ChildDashboard.tsx`
- `apps/web/src/features/family/FamilyMembers.tsx`

---

### Phase 4: Chore Steps & Instructions

**Priority:** High (Improves chore clarity)
**Estimated Time:** 2-3 days

**Goals:**

- Add step-by-step instructions to chores
- Allow parents to add images/media to steps
- Show steps during chore completion

**Tasks:**

- [ ] Add ChoreStep model to database

  ```prisma
  model ChoreStep {
    id           String   @id @default(uuid())
    templateId   String
    template     ChoreTemplate @relation(fields: [templateId], references: [id])
    title        String
    instructions String?
    mediaUrl     String?  // Photo/video URL
    order        Int

    @@unique([templateId, order])
  }
  ```

- [ ] Update ChoreTemplate creation form
  - Add "Steps" section
  - Allow adding/removing/reordering steps
  - Upload images for each step

- [ ] Create ChoreStepsDisplay component
  - Show during chore completion
  - Checkbox for each step
  - Display images inline

- [ ] Add step completion tracking (optional)
  - Store which steps are done
  - Show progress within a chore

**Files to Create:**

- `apps/api/src/routes/choreSteps.js`
- `apps/web/src/features/chores/ChoreStepsForm.tsx`
- `apps/web/src/features/chores/ChoreStepsDisplay.tsx`

**Migration:**

- `add_chore_steps`

---

### Phase 5: Goal Completion Workflow

**Priority:** Medium (Goals exist but not functional)
**Estimated Time:** 2 days

**Goals:**

- Make the existing Goal system functional
- Allow children to complete goal steps
- Award points for goal completion

**Tasks:**

- [ ] Create goal routes in backend
  - GET /goals - List goals
  - POST /goals - Create goal
  - POST /goals/:id/steps/:stepId/complete - Complete step
  - GET /goals/:id - Get goal with progress

- [ ] Create Goals.tsx functionality
  - Display assigned goals
  - Show progress bar
  - Complete individual steps
  - Mark entire goal as complete

- [ ] Add points for goal completion
  - Award points per step
  - Bonus for completing entire goal

**Files to Update:**

- Create: `apps/api/src/routes/goals.js`
- Update: `apps/web/src/features/goals/Goals.tsx`

---

### Phase 6: Enhanced Rewards System

**Priority:** Medium (Motivational feature)
**Estimated Time:** 3 days

**Goals:**

- Expand reward types beyond points
- Add reward redemption workflow
- Parent approval for reward requests

**Tasks:**

- [ ] Update Reward model

  ```prisma
  enum RewardType {
    points      // Physical reward (toy, treat)
    money       // Cash reward
    screentime  // Minutes of screen time
    pet_item    // Virtual pet item (Phase 8)
    privilege   // Special privilege
  }

  model Reward {
    // ... existing fields
    type         RewardType @default(points)
    value        String?    // "$5", "30min", "blue_hat"
    imageUrl     String?
  }
  ```

- [ ] Create reward redemption flow
  - Child clicks "Redeem" (costs points)
  - Creates Redemption with status "requested"
  - Parent sees notification
  - Parent approves/denies
  - If approved, deduct points via negative PointsTransaction

- [ ] Create RewardsStore component
  - Browse available rewards
  - Filter by type
  - Show point cost
  - Redeem button (if enough points)

- [ ] Create PendingRedemptions component (Parent view)
  - List all pending requests
  - Approve/deny buttons
  - History of past redemptions

**Files to Create:**

- `apps/api/src/routes/rewards.js`
- `apps/web/src/features/rewards/RewardsStore.tsx`
- `apps/web/src/features/rewards/RedemptionRequests.tsx`

**Migration:**

- `enhance_rewards_system`

---

### Phase 7: Weekly Points Reset

**Priority:** Medium (Keeps motivation fresh)
**Estimated Time:** 1 day

**Goals:**

- Reset "weekly points" counter each Sunday/Monday
- Keep lifetime points accumulating
- Show weekly leaderboard

**Tasks:**

- [ ] Add weekly reset logic
  - Option A: Filter transactions by date (current approach - no reset needed)
  - Option B: Add weekStartDate to PointsTransaction
  - Option C: Add weekNumber field for grouping

- [ ] Create weekly leaderboard
  - Rank children by weekly points
  - Reset display each week
  - Show badges for #1, #2, #3

- [ ] Add "Weeks" view to points page
  - Current week
  - Last week comparison
  - Historical weeks

**Files to Update:**

- `apps/api/src/routes/points.js` - Add weekly leaderboard endpoint
- `apps/web/src/features/points/WeeklyLeaderboard.tsx` (new)

---

### Phase 8: Pets & Gamification System

**Priority:** Low (Fun feature, not essential)
**Estimated Time:** 5-7 days

**Goals:**

- Virtual pet for each child
- Earn pet items with points
- Pet levels up with activity
- Shop for pet accessories

**Tasks:**

- [ ] Create Pet models

  ```prisma
  model Pet {
    id        String   @id @default(uuid())
    userId    String   @unique
    user      User     @relation(fields: [userId], references: [id])
    name      String
    type      String   // "cat", "dog", "dragon"
    level     Int      @default(1)
    xp        Int      @default(0)
    happiness Int      @default(50)
    items     PetItem[]
  }

  model Item {
    id          String   @id @default(uuid())
    name        String
    category    String   // "hat", "accessory", "food"
    imageUrl    String
    pointsCost  Int
  }

  model PetItem {
    id       String @id @default(uuid())
    petId    String
    pet      Pet    @relation(fields: [petId], references: [id])
    itemId   String
    item     Item   @relation(fields: [itemId], references: [id])
    equipped Boolean @default(false)
  }
  ```

- [ ] Create pet creation flow
  - Choose pet type on first login
  - Name your pet
- [ ] Build pet display component
  - Animated pet character
  - Show equipped items
  - Level and XP bar
  - Happiness meter

- [ ] Create item shop
  - Browse items by category
  - Purchase with points
  - Equip/unequip items

- [ ] Pet leveling system
  - Gain XP for completing chores
  - Level unlocks new items
  - Special animations on level up

**Files to Create:**

- `apps/api/src/routes/pets.js`
- `apps/web/src/features/pets/PetDisplay.tsx`
- `apps/web/src/features/pets/PetCreation.tsx`
- `apps/web/src/features/pets/ItemShop.tsx`

**Migration:**

- `add_pets_system`

---

### Phase 9: Calendar Export & Sync

**Priority:** Low (Nice-to-have)
**Estimated Time:** 2-3 days

**Goals:**

- Export chores to Google Calendar
- One-way sync (app → Google Calendar)
- Optional per-user feature

**Tasks:**

- [ ] Set up Google Calendar API integration
  - OAuth 2.0 setup
  - Get calendar API credentials
- [ ] Create export functionality
  - "Export to Google Calendar" button
  - Creates events for upcoming chores
  - Updates when chores are completed
- [ ] Add settings for sync preferences
  - Enable/disable calendar sync
  - Choose which calendar to sync to
  - Sync frequency settings

**Files to Create:**

- `apps/api/src/services/googleCalendar.js`
- `apps/web/src/features/settings/CalendarSync.tsx`

**External:**

- Google Calendar API setup
- Environment variables for API keys

---

### Phase 10: Mobile App Enhancement

**Priority:** Medium (PWA is good, native is better)
**Estimated Time:** 3-5 days

**Goals:**

- Add push notifications
- Offline mode improvements
- Better mobile gestures

**Tasks:**

- [ ] Implement push notifications
  - Chore due reminders
  - Approval notifications for parents
  - Points earned notifications
- [ ] Improve offline mode
  - Cache more data
  - Queue mutations when offline
  - Sync when back online
- [ ] Add mobile gestures
  - Swipe to complete chore
  - Pull to refresh
  - Haptic feedback

- [ ] Add home screen shortcuts
  - Quick complete for today's chores
  - View points

**Files to Update:**

- `apps/web/vite.config.ts` - PWA settings
- `apps/web/public/sw.js` - Service worker (create)

---

### Phase 11: Authentication Re-enable & User Management

**Priority:** High (Before production)
**Estimated Time:** 2 days

**Goals:**

- Re-enable Supabase authentication
- Add family invitation system
- User profile management

**Tasks:**

- [ ] Re-enable auth middleware
  - Uncomment in index.js
  - Test all routes with real tokens
  - Handle token expiration
- [ ] Create family invitation system
  - Generate invite codes
  - Join family via code
  - Set role (parent/child) on join
- [ ] Build user profile pages
  - Edit name, avatar
  - Change password
  - Family settings (parent only)
- [ ] Add family management for parents
  - Remove family members
  - Change member roles
  - View family activity log

**Files to Update:**

- `apps/api/src/index.js` - Uncomment auth
- Create: `apps/api/src/routes/family.js`
- Create: `apps/web/src/features/family/InviteFlow.tsx`
- Create: `apps/web/src/features/profile/UserProfile.tsx`

---

### Phase 12: Analytics & Insights

**Priority:** Low (Data-driven improvements)
**Estimated Time:** 3 days

**Goals:**

- Track chore completion rates
- Show trends over time
- Identify patterns

**Tasks:**

- [ ] Create analytics dashboard
  - Completion rate by child
  - Most/least completed chores
  - Points earned over time (graph)
  - Weekly comparison
- [ ] Add chore insights
  - Average time to complete
  - Approval wait time
  - Peak completion times
- [ ] Parent reports
  - Weekly summary email
  - Monthly progress report
  - Streak tracking (days in a row)

**Files to Create:**

- `apps/api/src/routes/analytics.js`
- `apps/web/src/features/analytics/Dashboard.tsx`

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

### Sprint 1 (Week 1)

1. ✅ Phase 1: Points System
2. ✅ Phase 2: Calendar Views
3. **Phase 3: Dashboard Improvements**

### Sprint 2 (Week 2)

4. **Phase 4: Chore Steps & Instructions**
5. **Phase 5: Goal Completion Workflow**

### Sprint 3 (Week 3)

6. **Phase 6: Enhanced Rewards System**
7. **Phase 7: Weekly Points Reset**

### Sprint 4 (Week 4)

8. **Phase 11: Authentication Re-enable**
9. Testing & bug fixes
10. Polish UI/UX

### Future Sprints

- Phase 8: Pets System (fun feature)
- Phase 9: Calendar Export (nice-to-have)
- Phase 10: Mobile Enhancements
- Phase 12: Analytics

---

## 📝 TECHNICAL DEBT & MAINTENANCE

**Current Items:**

- [ ] Add proper error handling to all API routes
- [ ] Add request validation with Zod on all endpoints
- [ ] Create TypeScript interfaces for API responses
- [ ] Add database indexes for performance
- [ ] Write unit tests for critical functions
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Set up CI/CD pipeline
- [ ] Add logging system (Winston/Pino)

**Before Production:**

- [ ] Add rate limiting
- [ ] Set up monitoring (Sentry)
- [ ] Add database backups
- [ ] Security audit
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Accessibility audit

---

## 🎨 DESIGN IMPROVEMENTS

**Current Priorities:**

- [ ] Create consistent icon system
- [ ] Add loading skeletons
- [ ] Improve empty states
- [ ] Add success/error toast notifications
- [ ] Better mobile navigation
- [ ] Dark mode support
- [ ] Customizable themes per family

---

## 📚 DOCUMENTATION NEEDED

- [ ] API documentation
- [ ] Component library documentation
- [ ] Database schema documentation
- [ ] Deployment guide
- [ ] Contributing guide
- [ ] User manual / help center

---

**Last Updated:** December 17, 2025  
**Current Phase:** Phase 3 (Dashboard Improvements) - Ready to start
