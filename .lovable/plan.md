

## Plan: Add AI-Powered Insights to Insights Page

### What You'll Get
A new "AI Analysis" section on the Insights page where AI reads your live OpenDOSM data and generates a smart summary — market trends, risk alerts, and actionable recommendations for sellers and buyers. One-click "Analyze" button triggers it.

### How It Works

```text
User clicks "AI Analysis"
       ↓
Frontend sends current OpenDOSM insights data
       ↓
Edge Function (supabase/functions/ai-insights/index.ts)
  → Calls Lovable AI Gateway with the data + system prompt
  → Returns AI-generated analysis
       ↓
Frontend displays the AI summary in a styled card
```

### Changes

#### 1. Create Edge Function `supabase/functions/ai-insights/index.ts`
- Receives the current insights data (titles, values, statuses) as context
- Calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with a system prompt like: *"You are a Malaysia food supply chain analyst. Given the following market data, provide a concise analysis with: 1) Key trends, 2) Risk alerts, 3) Recommendations for sellers, 4) Recommendations for buyers. Use bullet points. Be specific with numbers."*
- Returns the AI response text
- Handles 429/402 errors gracefully

#### 2. Update `src/pages/Insights.tsx`
- Add a new "AI Analysis" card/section at the top of the page
- "Generate AI Analysis" button that sends the current insights data to the edge function
- Display the AI response with markdown rendering (`react-markdown`)
- Show loading spinner while generating
- Cache the result so it doesn't re-fetch on every click (store in state)

#### 3. Install `react-markdown` dependency
- For rendering the AI response with proper formatting

### Files
- **New**: `supabase/functions/ai-insights/index.ts`
- **Edit**: `src/pages/Insights.tsx` — add AI analysis section
- **Edit**: `package.json` — add `react-markdown`

