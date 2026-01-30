# UX Design Guidelines - Duo Bikes System

**Design Philosophy**: "Fewer choices, bigger buttons, no surprises."

---

## 1. Core Principles

### Very Low Cognitive Load
- Maximum 5 items in navigation
- One primary action per screen
- Step-by-step wizards for complex tasks
- No hidden actions or menus

### Clear Visual Hierarchy
- Large, readable text (18-20px base, 24-32px headings)
- High contrast (dark text on light background)
- White space for breathing room
- Consistent color usage

### Large Touch-Friendly Elements
- Minimum 44px button heights (primary actions 56px+)
- Full-width buttons where possible
- No icon-only controls
- Adequate spacing between interactive elements

### User-First Approach
- Assume users may have limited tech confidence
- Design for tablet/mobile screens first
- Consider users with reduced vision or motor precision
- Clarity over cleverness

---

## 2. Global UI Rules

### Typography

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Body text | 18-20px | 400 | 1.6 |
| Labels | 18px | 500 | 1.6 |
| Headings (h3) | 24px | 700 | 1.4 |
| Headings (h2) | 32px | 700 | 1.3 |
| Headings (h1) | 40px | 700 | 1.2 |

**Font**: One clean sans-serif (Inter, Open Sans, or system default)

### Colors

```
Primary Actions:    Blue (#2563eb)
Danger:            Red (#dc2626)
Success:           Green (#16a34a)
Warning:           Orange (#ea580c)
Text:              Dark gray (#1a1a1a)
Muted:             Medium gray (#4a4a4a)
Background:        Light gray (#f8f8f8)
Cards:             White (#ffffff)
```

**Rules**:
- ✅ Use color + text (always include label)
- ✅ High contrast dark text on light background
- ❌ Never use color alone (colorblind accessibility)
- ❌ Never use light gray text (readability)

### Buttons

```css
/* All buttons must be */
Min height:        44px (56px+ for primary actions)
Min width:         Full width (except secondary)
Font weight:       700
Border radius:     8px
Focus ring:        3px blue outline with 2px offset
Disabled state:    50% opacity + not-allowed cursor
```

#### Button Styles

| Variant | Background | Text | Use Case |
|---------|-----------|------|----------|
| Primary | Blue | White | Main action |
| Secondary | Light gray | Dark | Alternative action |
| Success | Green | White | Confirm/complete |
| Danger | Red | White | Delete/cancel |

**Good Examples** ✅
```
[ Book this Bike ]
[ Confirm Reservation ]
[ Report Issue ]
```

**Bad Examples** ❌
```
[ ✓ ]  [ 🕒 ]  [ ⚙️ ]  (icon-only)
[ book ]  [ confirm ]  (too small, unclear)
```

---

## 3. Navigation Structure

### Desktop Navigation
- Logo / App name (left)
- Nav items (center)
- User name + Logout (right)
- Maximum 5 items
- Sticky to top

### Mobile Navigation
- Bottom nav bar (fixed)
- Icon + label for each item
- Maximum 5 items
- Tap-friendly spacing

### Acceptable Menu Items
```
Volunteer Portal:
├─ Home
├─ Book a Bike
├─ My Reservations
├─ Report Issue
└─ Stats

Admin Portal:
├─ Dashboard
├─ Manage Bikes
├─ Manage Locations
├─ Manage Users
└─ View Issues
```

**Anti-Patterns** ❌
- Dropdown menus (use tabs instead)
- Hidden side menus
- Nested navigation
- More than 5 items

---

## 4. Volunteer Portal - Screen-by-Screen

### Home Screen

**Purpose**: "Where do I start?"

**Layout**:
```
┌─────────────────────────────────┐
│ Welcome, Anna!                  │
│ You have completed 12 rides.    │
├─────────────────────────────────┤
│                                 │
│  Your Next Ride: Monday 3pm     │
│                                 │
├─────────────────────────────────┤
│ [ 🚴 Book a Bike ]              │
├─────────────────────────────────┤
│ [ 📅 My Reservations ]          │
├─────────────────────────────────┤
│ [ ⚠️ Report an Issue ]          │
├─────────────────────────────────┤
│ [ 📊 My Stats ]                 │
└─────────────────────────────────┘
```

**Content**:
- Big greeting with completed rides count
- Next upcoming reservation (if any)
- Four full-width action buttons
- No stats overload
- No charts or analytics

### Book a Bike - Wizard Flow

**Step 1: Choose Location**
- Location list (not map)
- Each card shows: Name, Address
- Tap to select → Step 2
- Tall cards, easy to tap

**Step 2: Choose Date & Time**
- Date picker
- Time buttons in grid (30-min increments)
- Show location opening hours
- Grey out unavailable times
- Large (48px+) time buttons

**Step 3: Choose Duration**
- Duration buttons: 1h, 2h, 3h, 4h, 5h, 6h, 7h, 8h
- One column on mobile, three columns on desktop
- No sliders
- Clear button pressed state

**Step 4: Choose Bike**
- List of available bikes
- Each bike shows: Name, Code, Status
- Selectable cards with blue highlight
- One bike at a time
- Show count of available bikes

**Step 5: Review & Confirm**
- Summary card with all details
- Location, Bike, Date, Time, Duration
- Show any relevant instructions
- Big "Confirm Reservation" button
- Note about 30-minute buffer
- Back button to change details

### My Reservations

**Layout**:
```
Upcoming | Past
─────────────────
[Reservation Card]
[Reservation Card]
[Reservation Card]
```

**Content per card**:
- Date & time (large, clear)
- Location name
- Bike name
- Status badge (BOOKED / COMPLETED)
- Action: Cancel button (upcoming only)

**Rules**:
- Two tabs (Upcoming / Past)
- No swipe gestures
- Large date/time display
- Confirmation dialog for cancel

### Report an Issue

**Form Fields**:
```
Select Bike
├─ Dropdown (required)

Problem Type
├─ Flat Tire
├─ Brake Issues
├─ Chain Problem
├─ Seat Issue
├─ Lock Problem
└─ Other

Severity
├─ 🟢 Low
├─ 🟡 Medium
└─ 🔴 High

Description
└─ Large text box (required)

Photo
└─ Optional upload

[ Submit ]
```

**After Submit**:
```
✅ Thank you!
The issue has been reported to administrators.
```

### My Stats

**Display**:
```
┌─────────────────┐
│ 24              │
│ Total Rides     │
└─────────────────┘

┌─────────────────┐
│ 48 hours        │
│ Total Time      │
└─────────────────┘

┌─────────────────┐
│ 18              │
│ Completed       │
└─────────────────┘
```

**Rules**:
- Large numbers
- Simple labels
- No complex charts
- Just facts

---

## 5. Admin Portal

### General Rules
- Tables with tall row height (48px+)
- Clear filters (Location, Date, Status)
- No hidden bulk actions
- Explicit action buttons
- Tabs instead of nested menus

### Dashboard

**Content**:
```
Today's Reservations        Open Issues
────────────────────────────────────────
[Reservation] [Reservation] Count: 3
[Reservation] [Reservation] View All →
[Reservation] [Reservation]

Out of Service Bikes:
[Bike] [Bike] [Bike]
```

### Management Pages

**Bikes Table**:
- Columns: Code | Name | Location | Status | Actions
- Row height: 56px
- Actions: Edit | Delete
- Status badge (Available / Out of Service)

**Locations**:
- Card grid or list
- Each shows: Name, Address, Hours
- Actions: Edit | Manage Hours | Delete

**Users**:
- Table format
- Columns: Name | Email | Role | Status | Actions
- Status badge (Active / Inactive)
- Actions: Edit | Deactivate

**Reservations**:
- Table with date filters
- Show: Bike | Volunteer | Time | Status
- Filterable by date, location, status

**Issues**:
- List with filters (Severity, Status)
- Color-coded: 🔴 HIGH | 🟡 MEDIUM | 🟢 LOW
- Status buttons: Acknowledge | Mark Fixed | Close

---

## 6. Error Handling & Feedback

### Human-Readable Errors ✅

```
❌ "This bike was just booked by someone else.
   Please choose another time or bike."

❌ "The location is closed on Sundays.
   Please choose a different date."

❌ "Your booking is too close to another
   reservation. Please add 30 minutes."
```

### Bad Errors ❌

```
❌ "Error 409: Conflict"
❌ "Validation failed"
❌ "Request timeout"
```

**Rules**:
- Explain what happened
- Explain why it happened
- Suggest what to do next
- Use plain language
- Use alert boxes with icons (❌ 🟡 ✅ ℹ️)

### Success Feedback ✅

```
✅ Your reservation is confirmed!
   Bike: Duo Bike 03
   Date: Monday, May 13, 2024
   Time: 10:00 AM – 12:00 PM
```

---

## 7. Accessibility Must-Haves

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close dialogs
- Arrow keys for lists/tabs

### Focus Indicators
- 3px blue outline with 2px offset
- Visible on all interactive elements
- Not removed for mouse users

### Labels & Semantics
- Every input has associated label
- Use semantic HTML (buttons, forms, etc.)
- Alt text for images
- Role attributes where needed

### No Surprises
- No auto-playing media
- No infinite scroll
- No session timeouts during booking
- Confirm before destructive actions

### Readable Content
- No animated text
- No blinking elements
- Clear language
- Short paragraphs

---

## 8. Visual Style Summary

### Aesthetic
- Clean, friendly, non-technical
- Lots of white space
- Large text and buttons
- Minimal animations
- No dark mode by default

### Spacing
- 1.5rem between sections
- 1rem between cards
- 0.5rem between form fields
- Generous padding inside cards

### Shadows & Borders
- Cards: 1px border + subtle shadow
- Selected cards: 2px blue border + stronger shadow
- No glowing effects

### Illustrations
- Use emoji for icons
- Simple, recognizable
- Consistent style

---

## 9. Anti-Patterns to Avoid ❌

❌ **Infinite Scroll** - Use pagination or "Load More" button instead

❌ **Hidden Menus** - Keep navigation visible always

❌ **Icon-Only Buttons** - Always include text label

❌ **Drag & Drop** - Use buttons and forms instead

❌ **Multi-Select Calendars** - Pick one date at a time

❌ **"Power-User" Shortcuts** - Keep it simple for everyone

❌ **Hover-Only Info** - Information must be visible or clearly labeled

❌ **Nested Dropdowns** - Use tabs instead

❌ **Autoplay Videos/Audio** - Always require user action

❌ **Form Auto-Submit** - Require explicit click

❌ **Light Gray Text** - High contrast only

❌ **Color as Only Indicator** - Always include text/icon

---

## 10. Guiding Rule

> **If a first-time user needs instructions to understand a screen, the screen is too complex.**

- Test with non-technical users
- Simplify if confusion occurs
- Prioritize clarity over cleverness

---

## 11. Implementation Checklist

### Every Page Should Have
- ✅ Clear heading (h1)
- ✅ Simple, focused purpose
- ✅ Large buttons (48px+)
- ✅ High contrast text
- ✅ Good spacing
- ✅ Mobile-friendly layout
- ✅ Keyboard accessible
- ✅ Error messages (human-readable)
- ✅ Success feedback
- ✅ Back/navigation options

### Every Button Should Have
- ✅ Minimum 48px height
- ✅ Full width or clearly visible
- ✅ Text label (no icons only)
- ✅ Clear purpose
- ✅ Focus outline
- ✅ Disabled state
- ✅ Loading state (if async)

### Every Form Should Have
- ✅ Associated labels
- ✅ Large input fields (44px+)
- ✅ Clear validation messages
- ✅ Helpful hints
- ✅ One primary action
- ✅ Cancel option
- ✅ Keyboard navigation

---

## 12. Component Library

### Button
```tsx
<Button variant="primary" size="lg" fullWidth>
  Book a Bike
</Button>
```

### Card
```tsx
<Card selectable selected={true}>
  <CardTitle>Central Park</CardTitle>
  <CardDescription>123 Main Street</CardDescription>
</Card>
```

### Alert
```tsx
<Alert type="error">
  This bike was just booked. Please choose another.
</Alert>
```

### Navigation
```tsx
<SimpleNav items={[
  { label: 'Home', href: '/', icon: '🏠' },
  { label: 'Book', href: '/book', icon: '🚴' },
]} />
```

---

**Last Updated**: January 29, 2026  
**Status**: Production Ready  
**Audience**: Developers, Designers, Product Team
