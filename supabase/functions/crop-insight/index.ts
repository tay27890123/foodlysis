import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const BodySchema = z.object({
  query: z.string().min(1).max(500),
  user_id: z.string().uuid().optional(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { query, user_id } = parsed.data

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a Malaysian agricultural market analyst. Given a crop or food product query, provide a concise market intelligence summary covering:
1. **Current Market Price** — typical wholesale/retail range in Malaysia (RM)
2. **Supply Status** — current availability (abundant, stable, tight, shortage)
3. **Price Trend** — recent trend (rising, stable, falling) with brief reason
4. **Key Producing States** — top Malaysian states for this crop
5. **Seasonality** — peak and off-peak seasons
6. **Actionable Insight** — one practical tip for buyers or sellers

Keep it factual, concise (under 250 words), and specific to Malaysia. Use bullet points. If you don't have exact data, provide reasonable estimates based on general knowledge and note it.`,
          },
          {
            role: 'user',
            content: query,
          },
        ],
        max_tokens: 600,
      }),
    })

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text()
      throw new Error(`AI API call failed [${aiResponse.status}]: ${errBody}`)
    }

    const aiData = await aiResponse.json()
    const summary = aiData.choices?.[0]?.message?.content ?? 'No summary generated.'

    // Save to market_insights table
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    await supabase.from('market_insights').insert({
      query,
      summary,
      user_id: user_id || null,
    })

    return new Response(JSON.stringify({ summary, query }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('Error in crop-insight:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
