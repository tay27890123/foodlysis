

## Current Problem

There is **no visible Sign Up / Login button** anywhere in the app. The `/auth` page exists and works, but users have no way to reach it — the Navbar has no auth link, and the Hero section only links to Marketplace and Food Map.

## Plan: Add Auth Access + Improvement Ideas

### Step 1 — Add Login/Sign Up button to Navbar
- Add a "Sign In" button (right side of Navbar, next to the dropdowns)
- When logged in, show user's business name + a "Sign Out" button instead
- Use the existing `useAuth` hook to check auth state
- Include in both desktop and mobile nav

### Step 2 — Add CTA on Hero Section
- Add a secondary "Get Started" or "Join Now" link to `/auth` so new visitors can sign up from the landing page

---

## Additional Improvement Ideas (based on what you've already built)

Here are ideas that build on your existing features without creating new ones:

1. **Protected Routes** — Marketplace posting and Insights AI queries should require login. Right now anyone can post listings without being authenticated, which bypasses your RLS policies.

2. **User Dashboard personalization** — After login, show the user's own listings on the Dashboard, with edit/delete capability. Currently the dashboard doesn't filter by user.

3. **Profile Settings page** — Let users update their business name, role (supplier/buyer), and state after signup. Currently there's no way to edit profile info.

4. **Password Reset flow** — Add a "Forgot password?" link on the Auth page and a `/reset-password` page so users can recover their accounts.

5. **Listing owner info** — Show seller's business name and state on marketplace listing cards so buyers know who they're contacting.

---

### What gets modified

| File | Change |
|------|--------|
| `src/components/Navbar.tsx` | Add Sign In button + authenticated user menu |
| `src/components/HeroSection.tsx` | Add "Get Started" CTA linking to `/auth` |

Shall I proceed with Steps 1 & 2 first, or would you like me to tackle any of the other improvement ideas as well?

