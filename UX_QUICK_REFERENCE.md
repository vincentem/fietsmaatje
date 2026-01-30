# UX Quick Reference Card

## Design Philosophy
**"Fewer choices, bigger buttons, no surprises."**

---

## Golden Rules

### 1️⃣ One Primary Action Per Screen
- Max 5 navigation items
- One big button per page (primary action)
- Secondary buttons are smaller
- No hidden menus or dropdowns

### 2️⃣ Large Touch Targets
```
Button minimum: 44px height (primary actions 56px+)
Input minimum: 44px height
Text minimum: 18px
Touch area: 48px+ all sides
```

### 3️⃣ High Contrast Text
```
❌ Light gray on white (unreadable)
✅ Dark (#1a1a1a) on white (#ffffff)
✅ White on dark blue (#2563eb)
```

### 4️⃣ Human-Readable Errors
```
❌ "Error 409: Conflict"
✅ "This bike was just booked. Choose another time."

❌ "Validation failed"
✅ "Please select a location to continue"
```

### 5️⃣ Always Show What's Happening
```
Loading: "Checking availability..."
Success: "✅ Bike booked successfully!"
Error: "❌ This location is closed. Try another date."
```

---

## Color Palette

```
🔵 Primary (Actions):     #2563eb (blue)
🔴 Danger (Delete):       #dc2626 (red)
🟢 Success (Confirm):     #16a34a (green)
🟠 Warning (Issue):       #ea580c (orange)
⚫ Text (Dark):           #1a1a1a (dark gray)
⚪ Background (Light):    #f8f8f8 (light gray)
```

**Rule**: Color + text always together
- ✅ 🟢 Available (green + text)
- ❌ 🔴 Unavailable (red alone)

---

## Typography

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| h1 | 40px | 700 | Page title |
| h2 | 32px | 700 | Section title |
| h3 | 24px | 600 | Card title |
| body | 18px | 400 | Paragraphs |
| label | 18px | 500 | Form labels |
| small | 16px | 400 | Hints |

**Line Height**: 1.6 (breathing room)

---

## Spacing

```
Section gap:        1.5rem (24px)
Element gap:        1rem (16px)
Card padding:       1.5rem (24px)
Button padding:     1rem (16px) vertical

Grid columns:
Desktop: 3-4 items per row
Mobile: 1 item per row
```

---

## Button Variants

| Variant | Background | Text | When |
|---------|-----------|------|------|
| Primary | Blue | White | Main action |
| Secondary | Light gray | Dark | Alternative |
| Success | Green | White | Confirm/done |
| Danger | Red | White | Delete/cancel |

**Example**:
```tsx
<Button variant="primary" size="lg">
  Book This Bike
</Button>

<Button variant="secondary">
  Back
</Button>

<Button variant="danger">
  Cancel Reservation
</Button>
```

---

## Component Library

### Button
```tsx
<Button 
  variant="primary"           // primary|secondary|danger|success
  size="lg"                   // sm|md|lg
  fullWidth={true}            // full width or not
  disabled={false}            // disabled state
>
  Book a Bike
</Button>
```

### Card
```tsx
<Card 
  selectable={true}           // clickable?
  selected={isSelected}       // currently selected?
  onClick={handleSelect}
>
  <CardTitle>Central Park</CardTitle>
  <CardDescription>123 Main St</CardDescription>
</Card>
```

### Alert
```tsx
<Alert 
  type="error"                // error|success|warning|info
  title="Booking Failed"      // optional
  onDismiss={handleDismiss}   // dismissible?
>
  This bike was just booked. Try another time.
</Alert>
```

### Navigation
```tsx
<SimpleNav 
  items={[
    { label: 'Home', href: '/', icon: '🏠' },
    { label: 'Book', href: '/book', icon: '🚴' },
  ]}
/>
```

---

## Focus States

```css
/* All interactive elements */
outline: 3px solid #2563eb;
outline-offset: 2px;

/* Visible on dark AND light backgrounds */
```

---

## Common Patterns

### Step-by-Step Wizard
```
┌─────────────────┐
│ Step 1: Pick    │ → Click card → Next
│ a location      │
└─────────────────┘

┌─────────────────┐
│ Step 2: Pick    │ ← Back | Next →
│ date & time     │
└─────────────────┘

┌─────────────────┐
│ Step 5: Review  │ ← Back | Confirm
│ & Confirm       │
└─────────────────┘
```

### Tabs
```
┌──────────────┬──────────────┐
│ Upcoming     │ Past         │
├──────────────┼──────────────┤
│ 🔵 5 rides   │ ⚪ 3 rides   │
│              │              │
│ [Ride Card]  │ [Ride Card]  │
│ [Ride Card]  │ [Ride Card]  │
└──────────────┴──────────────┘
```

### Confirmation Dialog
```
┌─────────────────────────────────┐
│ ⚠️ Are you sure?                │
│                                 │
│ You can only cancel within 24h. │
│                                 │
│ [Yes, Cancel]  [Keep Booking]   │
└─────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────┐
│ No Upcoming Rides                │
│                                 │
│ Ready to book your first ride?   │
│                                 │
│ [ Book Your First Bike ]        │
└─────────────────────────────────┘
```

---

## What NOT to Do ❌

- ❌ Icon-only buttons (always add text)
- ❌ Light gray text (high contrast only)
- ❌ Dropdowns/nested menus (use tabs)
- ❌ Drag & drop (use buttons)
- ❌ Auto-submit forms (require click)
- ❌ Hover-only info (always visible)
- ❌ Animated text/flashing
- ❌ Color as only indicator (use text too)
- ❌ More than 5 nav items
- ❌ Complex multi-step forms (wizard instead)

---

## Quick Checklist for Every Page

### Content
- [ ] Clear h1 heading
- [ ] Simple, focused purpose
- [ ] One primary action
- [ ] No data overload

### Design
- [ ] Large text (18px+)
- [ ] Large buttons (44px+, primary 56px+)
- [ ] Good spacing
- [ ] High contrast

### Interaction
- [ ] Back button available
- [ ] Loading state shown
- [ ] Error messages clear
- [ ] Success feedback given

### Accessibility
- [ ] Keyboard navigable
- [ ] Focus outline visible
- [ ] Labels for forms
- [ ] Color + text used

### Mobile
- [ ] Responsive layout
- [ ] Touch targets 48px+
- [ ] Bottom nav on mobile
- [ ] Forms fill properly

---

## Designer/Developer Sync

**Designers Say**: "Fewer choices, bigger buttons"  
**Developers Build**: Button/Card/Alert/Nav components  
**QA Tests**: All pages meet checklist  
**Users Experience**: Simple, clear, helpful

---

## Measurement of Success

✅ **Users don't need instructions** to use the app  
✅ **First-time users complete booking** without help  
✅ **Error messages explain** what went wrong + how to fix  
✅ **All interactive elements** are 48px+ (touchable)  
✅ **Text is always readable** (18px+, high contrast)  
✅ **Navigation is always visible** (never hidden)  
✅ **Back button works** on every step  
✅ **Loading/success states** are shown

---

## File Locations

```
📁 Components:
  ├── button.tsx           (sizes, variants, states)
  ├── card.tsx             (selectable, titles, descriptions)
  ├── alert.tsx            (types, icons, dismissible)
  └── simple-nav.tsx       (desktop + mobile navigation)

📁 Styles:
  └── globals.css          (typography, colors, spacing, focus)

📁 Pages (Volunteer):
  ├── dashboard/           (home screen)
  ├── find-bike/           (5-step wizard)
  ├── reservations/        (two-tab layout)
  └── report-issue/        (simple form)

📁 Documentation:
  ├── UX_GUIDELINES.md         (complete design system)
  ├── UX_IMPLEMENTATION.md     (what changed, why)
  └── UX_REDESIGN_COMPLETE.md  (summary, checklist)
```

---

## Copy Principles

### Be Friendly
```
❌ "Enter reservation details"
✅ "When do you want to ride?"
```

### Be Clear
```
❌ "Category selection required"
✅ "What's wrong with the bike?"
```

### Be Helpful
```
❌ "Invalid date"
✅ "The location is closed on Sundays. Choose a different date."
```

### Use Emoji
```
✅ 🚴 Bike
✅ 📅 Reservations
✅ 🔴 Urgent
✅ 🟢 Available
```

---

## Key Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Button Size | 44px min (primary 56px+) | CSS inspection |
| Font Size | 18px+ | CSS inspection |
| Contrast Ratio | 7:1 | WebAIM checker |
| Navigation Items | Max 5 | Page review |
| Touch Targets | 48px+ | Device testing |
| First-Time Success | 90%+ | User testing |

---

**Version**: 1.0  
**Last Updated**: January 29, 2026  
**Status**: Production Ready

🎉 **Your app is now user-friendly!**
