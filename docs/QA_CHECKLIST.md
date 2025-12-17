# Portfolio Ammo - QA Checklist

## Overview
This document provides comprehensive QA checklists for the Portfolio Ammo application.

---

## 1. Sanity Suite (Must-Pass on Every Deploy)
**Estimated Time: 5-10 minutes**

### Authentication
- [ ] Login page loads correctly
- [ ] Can login with valid credentials
- [ ] Invalid credentials show error message
- [ ] Logout works and redirects to login
- [ ] Forgot password flow sends email (check for toast)
- [ ] Set password page validates token

### Navigation
- [ ] Dashboard loads for authenticated user
- [ ] All nav links work (Dashboard, Update, Settings, Logs)
- [ ] Admin tab visible only for admin/owner users
- [ ] Mobile nav displays correctly on small screens
- [ ] Logo click returns to dashboard

### Core Functionality
- [ ] Dashboard shows portfolio summary cards
- [ ] Settings page saves changes successfully
- [ ] Update page submits new contributions
- [ ] Logs page displays recommendation history

### Error Handling
- [ ] 404 page displays for invalid routes
- [ ] Network errors show toast notifications
- [ ] Form validation errors display inline

---

## 2. Regression Suite (Before Releases)
**Estimated Time: 30-45 minutes**

### Authentication Module

#### Login Flow
- [ ] Email validation (format, required)
- [ ] Password validation (min 6 chars)
- [ ] Error message for invalid credentials
- [ ] Loading state during authentication
- [ ] Redirect to dashboard after login
- [ ] Remember session on page refresh

#### Signup Flow
- [ ] Create new account with valid email/password
- [ ] Duplicate email shows appropriate error
- [ ] Auto-redirect after successful signup

#### Password Reset
- [ ] "Forgot password" opens dialog
- [ ] Email field validates format
- [ ] Success toast always shown (privacy)
- [ ] Reset link works (check email)
- [ ] New password validation (match, min length)
- [ ] Redirect to login after reset

#### Admin Invite Flow
- [ ] Invite email sends successfully
- [ ] Set password link works
- [ ] Password validation on set-password page
- [ ] User appears in admin user list
- [ ] Role assignment works correctly

### Dashboard Module

#### Portfolio Overview
- [ ] Total value displays correctly
- [ ] Asset breakdown (SPY, TA-125, Cash) shows
- [ ] Percentages calculate correctly
- [ ] Pie chart renders with data
- [ ] Empty state shows for new users

#### Ammo Status
- [ ] Tranche badges show correct state (Ready/Used)
- [ ] Trigger percentages display
- [ ] Reset ready indicator shows when applicable

#### Market Data
- [ ] SPY chart loads
- [ ] TA-125/EIS chart loads
- [ ] Performance chart displays returns
- [ ] Drawdown chart shows current levels
- [ ] Loading state while fetching
- [ ] Error state handles API failures

#### First-Time User
- [ ] Onboarding banner displays
- [ ] Links to Settings and Update work
- [ ] Banner hides after first snapshot

### Settings Module

#### Target Allocation
- [ ] Stocks/Cash target inputs work
- [ ] Values persist after save
- [ ] Validation for numeric input

#### Cash Thresholds
- [ ] Min/Max/Target display correctly
- [ ] Changes save successfully

#### Ammo Triggers
- [ ] Tranche 1/2/3 triggers editable
- [ ] Rebuild threshold editable
- [ ] Values persist after refresh

#### Reset Ammo
- [ ] Confirmation dialog appears
- [ ] Checkbox required to confirm
- [ ] Reset changes ammo state
- [ ] Toast confirms action

### Update Module

#### Current Portfolio Values
- [ ] Edit button toggles editable state
- [ ] Values load from last snapshot
- [ ] Total calculates correctly
- [ ] Cancel reverts changes

#### Contributions
- [ ] Per-asset contribution inputs work
- [ ] Currency selector functions
- [ ] Total contribution calculates
- [ ] Zero values allowed

#### Market Status
- [ ] Current drawdown displays
- [ ] Market status badge shows
- [ ] Data refreshes on load

#### Strategy Recommendation
- [ ] Preview button generates recommendation
- [ ] Recommendation card displays
- [ ] Save creates new snapshot
- [ ] Notification created on save

### Logs Module
- [ ] All recommendations display
- [ ] Date column formatted correctly
- [ ] Type badges render
- [ ] Market status badges correct
- [ ] Drawdown percentages show
- [ ] Transfer amounts display
- [ ] Empty state for new users

### Admin Module (Admin/Owner Only)

#### Access Control
- [ ] Regular users cannot access /admin
- [ ] Admin users see Admin tab
- [ ] Owner users see Admin tab
- [ ] Direct URL access blocked for non-admins

#### Invite User
- [ ] Email field validates
- [ ] Name field optional
- [ ] Role selector (owner only)
- [ ] Invite sends email
- [ ] Success toast displays
- [ ] User appears in list

#### User Management
- [ ] User list loads
- [ ] Role badges display correctly
- [ ] Status badges (Active/Pending) correct
- [ ] Role change works (owner only)
- [ ] Cannot change own role
- [ ] Cannot change owner role

---

## 3. Security Checklist

### Authentication Security
- [ ] Passwords hashed (never stored plaintext)
- [ ] Session tokens secure
- [ ] Auto-logout on token expiry
- [ ] Rate limiting on login attempts
- [ ] Rate limiting on forgot password

### Authorization
- [ ] RLS policies on all tables
- [ ] Admin endpoints verify role server-side
- [ ] Owner-only actions restricted server-side
- [ ] Users can only see own data

### Input Validation
- [ ] Email format validated (client + server)
- [ ] Password min length enforced
- [ ] Numeric inputs validated
- [ ] SQL injection prevented (using Supabase client)
- [ ] XSS prevented (React auto-escaping)

### Sensitive Data
- [ ] No API keys in frontend code
- [ ] Secrets in environment variables
- [ ] No sensitive data in console logs
- [ ] HTTPS enforced

---

## 4. UI/UX Checklist

### Responsive Design
- [ ] Desktop (1920px) - full layout
- [ ] Laptop (1366px) - adapts correctly
- [ ] Tablet (768px) - mobile nav appears
- [ ] Mobile (375px) - all content accessible

### States & Feedback
- [ ] Loading spinners on async operations
- [ ] Success toasts for completed actions
- [ ] Error toasts for failures
- [ ] Empty states with helpful CTAs
- [ ] Disabled states for invalid forms

### Accessibility
- [ ] Focus visible on interactive elements
- [ ] Labels associated with inputs
- [ ] Color contrast sufficient
- [ ] Touch targets 44px+ on mobile

### Dark Mode
- [ ] Toggle works
- [ ] All components themed correctly
- [ ] Charts readable in dark mode
- [ ] No white flashes on load

---

## 5. Test Matrix

### Browsers
| Browser | Version | Priority |
|---------|---------|----------|
| Chrome | Latest | P0 |
| Safari | Latest | P0 |
| Firefox | Latest | P1 |
| Edge | Latest | P1 |

### Devices
| Device | Screen Size | Priority |
|--------|-------------|----------|
| Desktop | 1920x1080 | P0 |
| Laptop | 1366x768 | P0 |
| iPad | 768x1024 | P1 |
| iPhone | 375x812 | P0 |
| Android | 360x640 | P1 |

### User Roles
| Role | Test Priority |
|------|---------------|
| Owner | P0 |
| Admin | P0 |
| User | P0 |
| Unauthenticated | P0 |

---

## 6. Pass/Fail Criteria

### Sanity Suite
- **PASS**: All sanity checks pass
- **FAIL**: Any sanity check fails

### Regression Suite
- **PASS**: No P0 issues, ≤2 P1 issues
- **FAIL**: Any P0 issue, or >2 P1 issues

### Security Checklist
- **PASS**: All security checks pass
- **FAIL**: Any security check fails

---

## 7. Automation Recommendations

### Unit Tests (Vitest)
```
src/
├── lib/
│   ├── strategy.test.ts    # Strategy calculation logic
│   ├── currency.test.ts    # Currency formatting
│   └── utils.test.ts       # Utility functions
```

### Integration Tests
```
src/
├── hooks/
│   ├── useAuth.test.tsx    # Auth state management
│   └── useUserRole.test.tsx # Role checking
```

### E2E Tests (Playwright)
```
e2e/
├── auth.spec.ts            # Login/logout/signup
├── dashboard.spec.ts       # Dashboard loads
├── admin.spec.ts           # Admin access control
└── update.spec.ts          # Create portfolio update
```

### CI Pipeline
```yaml
# Example GitHub Actions
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit
      - name: Run E2E tests
        run: npm run test:e2e
```

---

## Appendix: Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| - | - | - |

*Last Updated: December 17, 2025*
