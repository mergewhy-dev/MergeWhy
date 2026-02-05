# Command: Build Dashboard UI

Copy this entire prompt into Claude Code to build the dashboard:

---

Build the MergeWhy dashboard UI. Follow these steps:

## Step 1: Create Dashboard Layout

Update apps/web/src/app/(dashboard)/layout.tsx with a proper layout:
- Collapsible sidebar with navigation items:
  - Dashboard (home icon)
  - Records (file-text icon) 
  - Repositories (git-branch icon)
  - Reports (bar-chart icon)
  - Settings (settings icon)
- Header with:
  - Logo/brand
  - Organization switcher (OrganizationSwitcher from Clerk)
  - User menu (UserButton from Clerk)
- Main content area

Use shadcn/ui components. Use lucide-react for icons.

## Step 2: Create Core Components

### apps/web/src/components/der-card.tsx
Card showing Decision Evidence Record summary:
- PR title and number (linked to GitHub)
- Repository name with icon
- Evidence score badge (red <50, yellow 50-75, green >75)
- Gap count if any exist
- Status badge (PENDING, NEEDS_REVIEW, CONFIRMED, COMPLETE)
- Relative time (e.g., "2 hours ago")

### apps/web/src/components/evidence-score-badge.tsx
Circular progress indicator:
- Score number (0-100) in center
- Color ring based on score
- Tooltip explaining what the score means

### apps/web/src/components/gap-alert.tsx
Alert component for evidence gaps:
- Icon based on gap type
- Gap message
- Suggestion for resolution
- Severity indicator (color)

### apps/web/src/components/stats-card.tsx
Dashboard stat card:
- Title
- Value (large number)
- Trend indicator (up/down arrow with percentage)
- Icon

## Step 3: Create Dashboard Pages

### apps/web/src/app/(dashboard)/page.tsx
Dashboard home with:
- Stats row: Total DERs, Pending Review, Avg Score, This Week
- "Needs Attention" section with DER cards that have gaps
- Recent activity feed

### apps/web/src/app/(dashboard)/records/page.tsx
Records list with:
- Search input
- Status filter tabs (All, Pending, Needs Review, Complete)
- Repository dropdown filter
- Table or card grid of DERs
- Pagination

### apps/web/src/app/(dashboard)/records/[id]/page.tsx
Single DER detail view:
- PR information header
- Evidence score prominently displayed
- Evidence items list (description, tickets, reviews, comments)
- Gaps section with resolution suggestions
- Timeline of activity
- "Confirm Evidence" button
- Export dropdown (PDF, JSON)

### apps/web/src/app/(dashboard)/repositories/page.tsx
Repository management:
- List of connected repositories
- "Connect Repository" button (triggers GitHub App install)
- Per-repo stats (total DERs, avg score)
- Settings link for each repo

### apps/web/src/app/(dashboard)/settings/page.tsx
Organization settings:
- Evidence requirements (checkboxes)
  - Require ticket link
  - Require description
  - Minimum reviewers
  - Block merge on gaps
- Integrations section
- Team management link

## Step 4: Add Loading States

For each page, create a loading.tsx with appropriate skeleton loaders using shadcn Skeleton component.

## Step 5: Add Error States

For each page, create an error.tsx with:
- Error message
- Retry button
- Link to go back

## Step 6: Test

1. Run `pnpm dev`
2. Navigate through all pages
3. Check responsive design (mobile/tablet/desktop)
4. Verify loading states appear
5. Test error boundary by throwing an error

## Step 7: Commit
```bash
git add .
git commit -m "feat: add dashboard UI components and pages"
```

After completion, update claude-progress.txt.
