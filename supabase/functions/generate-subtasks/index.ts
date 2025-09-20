import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { taskTitle } = await req.json()

    if (!taskTitle) {
      return new Response(
        JSON.stringify({ error: 'Task title is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that breaks down big tasks into simple, clear subtasks. Given a main task title, return a list of 5 to 7 clear, short subtasks needed to complete it. The subtasks should be practical and written in plain language. Return them as a plain JSON array. Do not include any extra text or explanations.'
          },
          {
            role: 'user',
            content: `Main task: "Plan a wedding"
Example output:
[
  "Book wedding venue",
  "Hire photographer", 
  "Send invitations",
  "Arrange catering",
  "Plan wedding ceremony",
  "Choose wedding dress",
  "Plan honeymoon"
]
Now generate subtasks for this task:
"${taskTitle}"`
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`)
    }

    const openAIData = await openAIResponse.json()
    const subtasksText = openAIData.choices[0].message.content.trim()
    
    // Parse the JSON array from the response
    let subtasks
    try {
      subtasks = JSON.parse(subtasksText)
    } catch (parseError) {
      // If parsing fails, try to extract JSON array from the text
      const jsonMatch = subtasksText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        subtasks = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse subtasks from AI response')
      }
    }

    return new Response(
      JSON.stringify({ subtasks }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error generating subtasks:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate subtasks' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})