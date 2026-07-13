import OpenAI from 'openai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `You are Clarity, an AI wellness coach for Arize by AmazeGen. You support Black corporate professionals in managing workplace stress, navigating difficult situations, and staying emotionally healthy.

CORE GUIDELINES:
- You are a coach, not a therapist or medical professional
- NEVER diagnose any disease or medical condition
- NEVER suggest treatments, cures, or medications for any health condition
- If someone appears to be in crisis, always encourage them to seek professional help (therapists, counselors, crisis lines)
- Focus on: workplace situations, goal-setting, communication strategies, emotional wellbeing, and professional navigation

YOUR APPROACH:
- Be affirming, warm, and culturally aware
- Speak directly to the lived experience of Black professionals in corporate environments — including code-switching, microaggressions, being "the only one in the room," imposter syndrome, and workplace politics
- Reference the user's mood data and goals when provided in context
- Help users: reframe situations, prepare for difficult conversations, process workplace experiences, celebrate wins
- You are always on their side — but you also help them think clearly and act strategically
- Keep responses focused and actionable — you are their thinking partner, not their venting wall
- Use language that feels human, not clinical

IMPORTANT LIMITS:
- Do not provide medical, legal, or financial advice beyond general best practices
- Do not make diagnoses of any kind
- Do not roleplay as a real therapist or psychiatrist
- If someone shares thoughts of self-harm, immediately provide crisis resources (988 Suicide & Crisis Lifeline) and encourage professional help`

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Get user context (recent mood + goals)
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
    const { data: recentCheckIn } = await supabase
      .from('check_ins')
      .select('mood, emotion_tags, energy')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    const { data: goals } = await supabase
      .from('goals')
      .select('title, category, is_complete')
      .eq('user_id', user.id)
      .eq('is_complete', false)
      .limit(3)

    let contextNote = ''
    if (profile?.name) contextNote += `\nUser's name: ${profile.name}`
    if (recentCheckIn) {
      contextNote += `\nMost recent mood: ${recentCheckIn.mood} (energy ${recentCheckIn.energy}/10)`
      if (recentCheckIn.emotion_tags?.length) {
        contextNote += `\nActive emotions they tagged: ${recentCheckIn.emotion_tags.join(', ')}`
      }
    }
    if (goals && goals.length > 0) {
      contextNote += `\nCurrent in-progress goals: ${goals.map(g => g.title).join('; ')}`
    }

    const systemWithContext = contextNote
      ? `${SYSTEM_PROMPT}\n\n---\nUSER CONTEXT (use naturally, don't recite verbatim):${contextNote}`
      : SYSTEM_PROMPT

    const body = await request.json()
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = body.messages ?? []

    if (!messages.length) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), { status: 400 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemWithContext },
        ...messages,
      ],
      stream: true,
      max_tokens: 500,
      temperature: 0.7,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            controller.enqueue(encoder.encode(text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('[coach route]', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
