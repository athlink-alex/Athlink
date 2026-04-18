// Anthropic AI Coach Edge Function
// Proxies AI requests so the API key stays server-side

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.88.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured on server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anthropic = new Anthropic({ apiKey })

    const body = await req.json()
    const { type, system, messages, max_tokens, model } = body

    if (!type || !messages) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, messages' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // All AI calls go through the same Anthropic messages API
    // The client sends the full system prompt + messages
    const response = await anthropic.messages.create({
      model: model || 'claude-sonnet-4-6',
      max_tokens: max_tokens || 1500,
      system: system || '',
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages,
    })

    // Extract text content
    const textContent = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n')

    return new Response(
      JSON.stringify({ content: textContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('AI Coach error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})