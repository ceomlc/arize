'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CoachMessage } from '@/lib/types'

const INITIAL_MESSAGE: CoachMessage = {
  role: 'assistant',
  content: "I'm Clarity, your AI coach. I'm here to help you navigate whatever's coming up — whether you need to prepare for a hard conversation, process something from today, or just think out loud.\n\nWhat's on your mind?",
}

const SUGGESTED_PROMPTS = [
  { prefix: 'Reframe', text: 'Help me reframe this situation before I react' },
  { prefix: 'Prepare', text: 'Prep me for a hard conversation with my manager' },
  { prefix: 'Process', text: 'I need to talk through what happened today' },
  { prefix: 'Goals', text: 'Help me set goals that actually align with my values' },
]

export default function CoachPage() {
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [messages, setMessages] = useState<CoachMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState('')
  const [recentMood, setRecentMood] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function loadContext() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileRaw } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      const profile = profileRaw as { name: string | null } | null
      if (profile?.name) setUserName(profile.name.split(' ')[0])

      const { data: checkInRaw } = await supabase
        .from('check_ins')
        .select('mood, emotion_tags')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const checkIn = checkInRaw as { mood: string; emotion_tags: string[] | null } | null

      if (checkIn) {
        setRecentMood(checkIn.mood)
        // Contextual opening based on mood data
        const tags = checkIn.emotion_tags ?? []
        if (tags.length > 0) {
          const tagList = tags.slice(0, 2).join(' and ')
          const contextualOpening: CoachMessage = {
            role: 'assistant',
            content: `${profile?.name ? profile.name.split(' ')[0] + ', I' : 'I'} see you were feeling ${tagList} in your last check-in. Do you want to talk through what's been happening, or would it help to work on something specific today?`,
          }
          setMessages([contextualOpening])
        }
      }
    }
    loadContext()

    // Handle ?prompt=help-goals from Sunday Goal Session
    const prompt = searchParams.get('prompt')
    if (prompt === 'help-goals') {
      setInput("I want to set meaningful goals for this week. Can you help me think through what matters most right now?")
      setTimeout(() => textareaRef.current?.focus(), 300)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(content?: string) {
    const messageContent = content ?? input.trim()
    if (!messageContent || streaming) return

    setInput('')
    setError('')

    const userMsg: CoachMessage = { role: 'user', content: messageContent }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setStreaming(true)

    // Add empty assistant message to stream into
    const assistantMsg: CoachMessage = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No response body')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      }
    } catch {
      setError('Clarity is unavailable right now. Please check your connection and try again.')
      setMessages(prev => prev.slice(0, -1)) // Remove empty assistant message
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{ background: '#0E1C12', display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 128px)' }}>

      {/* Header */}
      <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A227', marginBottom: '8px' }}>
          Clarity Coach
        </p>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', color: '#F5F0E8', fontWeight: 400, lineHeight: 1.3, marginBottom: '2px' }}>
          Work It Out With Clarity
        </h2>
        <p style={{ fontSize: '12px', color: '#BDB5A0', marginBottom: '12px' }}>
          AI-guided, culturally aware. Always available.
        </p>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 8px' }}>

        {/* Coach intro */}
        <div style={{
          margin: '0 0 16px',
          background: 'linear-gradient(135deg, rgba(36,61,40,1) 0%, rgba(20,36,22,1) 100%)',
          border: '1px solid rgba(74,124,89,0.3)',
          borderRadius: '16px', padding: '16px',
          display: 'flex', gap: '12px', alignItems: 'flex-start',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #6B9E7A, #243D28)',
            border: '1px solid rgba(74,124,89,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
          }}>🌿</div>
          <div>
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '14px', color: '#F5F0E8', fontStyle: 'italic', fontWeight: 400, lineHeight: 1.5 }}>
              {recentMood
                ? `I'm here to help you navigate whatever today brings. Your last check-in showed you're feeling ${recentMood} — let's work with that.`
                : "I'm here for the hard moments and the wins alike. Tell me what's on your mind."}
            </p>
            <p style={{ fontSize: '10px', color: '#A8C4AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '8px' }}>
              Clarity · Your AI Coach
            </p>
          </div>
        </div>

        {/* Suggested prompts */}
        {messages.length <= 1 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A227', marginBottom: '10px' }}>
              Suggested Prompts
            </p>
            {SUGGESTED_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => sendMessage(p.text)}
                style={{
                  display: 'block', width: '100%',
                  background: '#1A2E1E', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px', padding: '13px 16px', marginBottom: '8px',
                  fontSize: '13px', color: '#F5F0E8', cursor: 'pointer',
                  lineHeight: 1.4, textAlign: 'left',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                <span style={{ fontSize: '10px', color: '#C9A227', display: 'block', marginBottom: '3px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {p.prefix}
                </span>
                {p.text}
              </button>
            ))}
          </div>
        )}

        {/* Chat messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                maxWidth: '82%',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                display: 'flex',
              }}
            >
              <div style={{
                padding: '12px 15px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? 'rgba(201,162,39,0.15)' : 'rgba(74,124,89,0.2)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(201,162,39,0.25)' : 'rgba(74,124,89,0.3)'}`,
                fontSize: '13px', color: '#F5F0E8', lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
                {streaming && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '' && (
                  <span style={{ opacity: 0.5 }}>Thinking…</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p style={{ fontSize: '12px', color: '#C4614A', padding: '10px 14px', background: 'rgba(196,97,74,0.1)', borderRadius: '8px', marginBottom: '8px' }}>
            {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px', background: 'rgba(14,28,18,0.95)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', gap: '8px', alignItems: 'flex-end', flexShrink: 0,
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Say something to Clarity…"
          rows={1}
          disabled={streaming}
          style={{
            flex: 1, background: '#1A2E1E',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
            padding: '11px 16px', fontSize: '13px', color: '#F5F0E8',
            outline: 'none', fontFamily: 'var(--font-dm-sans)',
            maxHeight: '120px', lineHeight: 1.4,
            opacity: streaming ? 0.6 : 1,
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || streaming}
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: input.trim() && !streaming ? '#C9A227' : 'rgba(255,255,255,0.1)',
            border: 'none', cursor: input.trim() && !streaming ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, color: input.trim() && !streaming ? '#0E1C12' : '#BDB5A0',
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
