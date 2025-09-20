const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openAIKey = Deno.env.get('OPEN_API_KEY')
    if (!openAIKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user from the auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get all tasks without embeddings for this user
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('user_id', user.id)
      .is('embedding', null)

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tasks' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'All tasks already have embeddings', updated: 0 }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let updatedCount = 0

    // Generate embeddings for each task
    for (const task of tasks) {
      try {
        // Generate embedding for the task title
        const openAIResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-large',
            input: task.title
          }),
        })

        if (!openAIResponse.ok) {
          console.error(`Failed to generate embedding for task ${task.id}:`, await openAIResponse.text())
          continue
        }

        const openAIData = await openAIResponse.json()
        const embedding = openAIData.data[0].embedding

        // Update the task with the embedding
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ embedding })
          .eq('id', task.id)

        if (updateError) {
          console.error(`Failed to update task ${task.id} with embedding:`, updateError)
          continue
        }

        updatedCount++
        console.log(`Generated embedding for task: ${task.title}`)

      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error)
        continue
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully generated embeddings for ${updatedCount} tasks`,
        updated: updatedCount,
        total: tasks.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in generate-task-embeddings:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})