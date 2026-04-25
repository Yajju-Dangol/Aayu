import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    const { transcript, userId, logs } = await req.json()

    if (!userId) {
      throw new Error("Missing userId")
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY is not set in edge function environment")

    const systemInstruction = `
You are a medical data extraction assistant.
Analyze the provided conversation transcript AND the agent's tool logs.
The logs often contain exact answers collected during the session.
Extract the following information and output it as a valid JSON object. 
If an answer is missing, return "N/A" for that field.
- meal_composition: What did they have for meals? (e.g., Rice, Lentils, Spinach)
- portion_size: Did they finish the whole plate, or just half?
- hydration: How many glasses of water/tea have they had?
- appetite_levels: Are they feeling hungry or forced to eat?
- medication: Did they take all medicines for the day?
- symptoms: Any symptoms mentioned?
- sleep_quality: Wake up frequency, do they feel rested?
- energy_levels: Energy level on a scale of 1 to 5.
- social_interaction: Who did they talk to today?

Output strictly JSON. Do not include markdown formatting like \`\`\`json.
    `;

    const combinedContent = `TRANSCRIPT:\n${transcript}\n\nAGENT LOGS:\n${logs || 'No logs'}`;

    // Direct fetch to Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ parts: [{ text: combinedContent }] }],
        generationConfig: { temperature: 0.1 }
      })
    })

    const geminiData = await response.json()
    
    if (geminiData.error) {
       throw new Error(`Gemini API Error: ${geminiData.error.message}`)
    }

    let jsonStr = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim()
    const metricsData = JSON.parse(jsonStr)

    // Store in Supabase using Service Role key to bypass RLS or simply authenticate securely
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? '',
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ''
    )

    // Ensure profile exists to prevent foreign key errors
    await supabaseClient.from('profiles').upsert(
      { id: userId, full_name: 'Aayu Patient' },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    const { error } = await supabaseClient.from('health_metrics').insert({
      user_id: userId,
      metric_type: 'session_analysis',
      details: metricsData,
      recorded_at: new Date().toISOString()
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true, metrics: metricsData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.error("Edge function error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    })
  }
})
