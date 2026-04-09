

## Plan: Transportation Option, Processing Fee Notice & Contact Flow

### Summary
Add a "transportation available" toggle for sellers, show it as a label on listings, enhance the contact flow for buyers with a transport help option, and display processing fee + membership note before posting.

### Changes

#### 1. Database Migration
- Add `transportation_available` boolean column (default `false`) to `surplus_listings` table

#### 2. AddListingModal — Seller Form Updates
- Add a toggle/switch for "Transportation Available" (yes/no)
- Before the submit button, add a small notice:
  - *"A 1% processing fee will be charged on total revenue per transaction."*
  - *"Join as a member to have all processing fees waived."* (smaller, muted text)
- Include `transportation_available` in the insert/update payload
- When editing, pre-fill the toggle from existing data

#### 3. SurplusCard — Transportation Badge
- Show a small badge/label like "🚛 Transport Available" or "📦 Self-pickup" on each listing card based on the `transportation_available` field

#### 4. Contact Seller Flow (Buy tab)
- Replace the simple toast with a dialog when clicking "Contact Seller"
- If the listing has `transportation_available = true`: show seller contact info/message prompt directly
- If `transportation_available = false`: show two options:
  1. **"Get help from platform"** — shows a message like "Our logistics partners will assist with delivery. Platform coordination fees may apply."
  2. **"I'll arrange transport myself"** — proceeds to contact seller directly
- Both options end with a toast confirmation for now (no actual messaging backend yet)

#### 5. Type Updates
- Add `transportation_available` to the `SurplusListing` interface in `useSurplusListings.ts`

### Files to modify
- **Migration**: Add `transportation_available` column
- `src/hooks/useSurplusListings.ts` — add field to interface
- `src/components/AddListingModal.tsx` — toggle + fee notice
- `src/pages/Match.tsx` — transport badge on card + contact dialog with transport options

