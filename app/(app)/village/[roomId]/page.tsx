'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Mic, MicOff, Video, VideoOff, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { VillageRoom, VillageMessage } from '@/lib/types'

const AVATAR_COLORS = ['#4A7C59', '#C9A227', '#7BADC4', '#C4614A', '#A8C4AF', '#E8B84B']

function getAvatarColor(userId: string) {
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const supabase = createClient()

  const [room, setRoom] = useState<VillageRoom | null>(null)
  const [messages, setMessages] = useState<VillageMessage[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string | null } | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [isModerator, setIsModerator] = useState(false)
  const [moderatorIds, setModeratorIds] = useState<Set<string>>(new Set())
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [videoRecording, setVideoRecording] = useState(false)
  const [videoRecordingSeconds, setVideoRecordingSeconds] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const videoRecorderRef = useRef<MediaRecorder | null>(null)
  const videoChunksRef = useRef<Blob[]>([])
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const videoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/sign-in'); return }

      const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      setCurrentUser({ id: user.id, name: profile?.name ?? null })

      const { data: roomData } = await supabase.from('village_rooms').select('*').eq('id', roomId).single()
      setRoom(roomData)

      const { data: membership } = await supabase
        .from('village_memberships').select('user_id, is_moderator')
        .eq('user_id', user.id).eq('room_id', roomId).single()

      if (membership) {
        setIsMember(true)
        setIsModerator(membership.is_moderator ?? false)
        await loadMessages()
        await loadModerators()
        subscribeToMessages()
      }

      setLoading(false)
    }
    init()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (videoTimerRef.current) clearInterval(videoTimerRef.current)
    }
  }, [roomId])

  async function loadMessages() {
    const { data } = await supabase
      .from('village_messages').select('*, profiles(name, username)')
      .eq('room_id', roomId).order('created_at', { ascending: true }).limit(100)
    setMessages((data ?? []) as VillageMessage[])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function loadModerators() {
    const { data } = await supabase
      .from('village_memberships').select('user_id')
      .eq('room_id', roomId).eq('is_moderator', true)
    if (data) setModeratorIds(new Set(data.map(m => m.user_id)))
  }

  function subscribeToMessages() {
    supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'village_messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const { data: newMsg } = await supabase.from('village_messages').select('*, profiles(name, username)').eq('id', payload.new.id).single()
          if (newMsg) {
            setMessages(prev => [...prev, newMsg as VillageMessage])
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
          }
        })
      .subscribe()
  }

  async function joinRoom() {
    if (!currentUser) return
    const { count } = await supabase.from('village_memberships').select('*', { count: 'exact', head: true }).eq('room_id', roomId)
    const isFirst = (count ?? 0) === 0
    await supabase.from('village_memberships').insert({ user_id: currentUser.id, room_id: roomId, is_moderator: isFirst })
    setIsMember(true)
    setIsModerator(isFirst)
    if (isFirst) setModeratorIds(new Set([currentUser.id]))
    await loadMessages()
    await loadModerators()
    subscribeToMessages()
  }

  async function sendMessage() {
    if (!text.trim() || !currentUser || sending) return
    setSending(true)
    const content = text.trim()
    setText('')
    await supabase.from('village_messages').insert({ room_id: roomId, user_id: currentUser.id, content, message_type: 'text' })
    setSending(false)
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (audioChunksRef.current.length === 0 || !currentUser) return
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const fileName = `${roomId}/${Date.now()}-${currentUser.id}.webm`
        const { error: uploadError } = await supabase.storage.from('village-audio').upload(fileName, blob, { contentType: 'audio/webm' })
        if (uploadError) { console.error('Audio upload failed:', uploadError); return }
        const { data: { publicUrl } } = supabase.storage.from('village-audio').getPublicUrl(fileName)
        await supabase.from('village_messages').insert({
          room_id: roomId, user_id: currentUser.id,
          content: '🎤 Voice message', message_type: 'audio', audio_url: publicUrl,
        })
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
      setRecordingSeconds(0)
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000)
    } catch (err) {
      console.error('Mic access denied:', err)
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
    setRecording(false)
    setRecordingSeconds(0)
  }

  async function startVideoRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
        videoPreviewRef.current.play()
      }
      videoChunksRef.current = []
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      recorder.ondataavailable = (e) => { if (e.data.size > 0) videoChunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null
        if (videoChunksRef.current.length === 0 || !currentUser) return
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
        const blob = new Blob(videoChunksRef.current, { type: mimeType })
        const fileName = `${roomId}/video-${Date.now()}-${currentUser.id}.${ext}`
        const { error: uploadError } = await supabase.storage.from('village-audio').upload(fileName, blob, { contentType: mimeType })
        if (uploadError) { console.error('Video upload failed:', uploadError); return }
        const { data: { publicUrl } } = supabase.storage.from('village-audio').getPublicUrl(fileName)
        await supabase.from('village_messages').insert({
          room_id: roomId, user_id: currentUser.id,
          content: '🎥 Video message', message_type: 'video', audio_url: publicUrl,
        })
      }
      recorder.start()
      videoRecorderRef.current = recorder
      setVideoRecording(true)
      setVideoRecordingSeconds(0)
      videoTimerRef.current = setInterval(() => {
        setVideoRecordingSeconds(s => {
          if (s + 1 >= 60) { stopVideoRecording(); return 0 }
          return s + 1
        })
      }, 1000)
    } catch (err) {
      console.error('Camera access denied:', err)
    }
  }

  function stopVideoRecording() {
    if (videoTimerRef.current) clearInterval(videoTimerRef.current)
    videoRecorderRef.current?.stop()
    setVideoRecording(false)
    setVideoRecordingSeconds(0)
  }

  async function assignModerator(userId: string) {
    if (!isModerator || userId === currentUser?.id) return
    await supabase.from('village_memberships').update({ is_moderator: true }).eq('user_id', userId).eq('room_id', roomId)
    setModeratorIds(prev => new Set([...prev, userId]))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (loading) {
    return (
      <div style={{ background: '#0E1C12', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#BDB5A0', fontSize: '13px' }}>Loading room…</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#0E1C12', display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 96px)' }}>

      {/* Room header */}
      <div style={{ padding: '12px 16px', background: 'rgba(26,46,30,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <Link href="/village" style={{ color: '#BDB5A0', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '16px', color: '#F5F0E8', fontWeight: 400, lineHeight: 1.2 }}>
            {room?.name ?? 'Room'}
          </p>
          <p style={{ fontSize: '11px', color: '#BDB5A0' }}>{room?.description}</p>
        </div>
        {isModerator && (
          <span style={{ fontSize: '10px', color: '#C9A227', background: 'rgba(201,162,39,0.1)', padding: '3px 8px', borderRadius: '100px', border: '1px solid rgba(201,162,39,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Crown size={10} /> Mod
          </span>
        )}
      </div>

      {!isMember ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '18px', marginBottom: '16px' }}>💬</p>
          <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', color: '#F5F0E8', fontWeight: 400, marginBottom: '12px' }}>
            Join {room?.name}
          </h3>
          <p style={{ fontSize: '13px', color: '#BDB5A0', lineHeight: 1.5, marginBottom: '24px', maxWidth: '280px' }}>
            {room?.description} Join to read and participate in the conversation.
          </p>
          <button onClick={joinRoom}
            style={{ background: '#C9A227', color: '#0E1C12', border: 'none', padding: '13px 28px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}>
            Join this room
          </button>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontSize: '13px', color: '#BDB5A0', lineHeight: 1.5 }}>
                  Be the first to say something in {room?.name}.
                </p>
              </div>
            )}
            {messages.map(msg => {
              const isOwn = msg.user_id === currentUser?.id
              const profile = msg.profiles as { name: string | null; username: string | null } | null
              const name = profile?.username ? `@${profile.username}` : (profile?.name ?? 'Member')
              const isMsgModerator = moderatorIds.has(msg.user_id)
              return (
                <div key={msg.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                  {!isOwn && (
                    <button
                      onClick={() => isModerator && !isMsgModerator ? assignModerator(msg.user_id) : undefined}
                      title={isModerator && !isMsgModerator ? 'Make moderator' : undefined}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: getAvatarColor(msg.user_id),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontWeight: 600, color: 'white', flexShrink: 0,
                        border: isMsgModerator ? '2px solid #C9A227' : '2px solid transparent',
                        cursor: isModerator && !isMsgModerator ? 'pointer' : 'default',
                        padding: 0,
                      }}>
                      {getInitials(name)}
                    </button>
                  )}
                  <div style={{ maxWidth: '75%' }}>
                    {!isOwn && (
                      <p style={{ fontSize: '10px', color: '#BDB5A0', marginBottom: '3px', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {name}
                        {isMsgModerator && <Crown size={9} color="#C9A227" />}
                      </p>
                    )}
                    <div style={{
                      padding: (msg.message_type === 'audio' || msg.message_type === 'video') ? '6px 8px' : '10px 14px',
                      borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isOwn ? 'rgba(201,162,39,0.15)' : 'rgba(74,124,89,0.2)',
                      border: `1px solid ${isOwn ? 'rgba(201,162,39,0.25)' : 'rgba(74,124,89,0.3)'}`,
                      fontSize: '13px', color: '#F5F0E8', lineHeight: 1.5,
                    }}>
                      {msg.message_type === 'audio' && msg.audio_url ? (
                        <audio controls src={msg.audio_url} style={{ height: '32px', maxWidth: '200px', display: 'block' }} />
                      ) : msg.message_type === 'video' && msg.audio_url ? (
                        <video controls src={msg.audio_url} style={{ maxWidth: '220px', maxHeight: '160px', borderRadius: '8px', display: 'block' }} />
                      ) : (
                        msg.content
                      )}
                    </div>
                    <p style={{ fontSize: '9px', color: '#BDB5A0', marginTop: '3px', textAlign: isOwn ? 'right' : 'left', marginRight: isOwn ? '4px' : 0, marginLeft: isOwn ? 0 : '4px' }}>
                      {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: '12px 16px', background: 'rgba(26,46,30,0.9)', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            {videoRecording ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <video ref={videoPreviewRef} muted playsInline style={{ width: '100%', maxHeight: '180px', borderRadius: '12px', objectFit: 'cover', background: '#000' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(196,97,74,0.1)', border: '1px solid rgba(196,97,74,0.3)', borderRadius: '20px', padding: '10px 16px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C4614A', display: 'inline-block' }} />
                    <span style={{ fontSize: '13px', color: '#C4614A' }}>Recording {formatTime(videoRecordingSeconds)} / 1:00</span>
                  </div>
                  <button onClick={stopVideoRecording}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#C4614A', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                    <VideoOff size={16} />
                  </button>
                </div>
              </div>
            ) : recording ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(196,97,74,0.1)', border: '1px solid rgba(196,97,74,0.3)', borderRadius: '20px', padding: '10px 16px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C4614A', display: 'inline-block' }} />
                  <span style={{ fontSize: '13px', color: '#C4614A' }}>Recording {formatTime(recordingSeconds)}</span>
                </div>
                <button onClick={stopRecording}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#C4614A', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  <MicOff size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={startRecording}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BDB5A0', flexShrink: 0 }}>
                  <Mic size={15} />
                </button>
                <button onClick={startVideoRecording}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BDB5A0', flexShrink: 0 }}>
                  <Video size={15} />
                </button>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Say something…"
                  rows={1}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
                    padding: '10px 16px', fontSize: '13px', color: '#F5F0E8',
                    outline: 'none', fontFamily: 'var(--font-dm-sans)', maxHeight: '100px', lineHeight: 1.4,
                  }}
                />
                <button onClick={sendMessage} disabled={!text.trim() || sending}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: text.trim() ? '#C9A227' : 'rgba(255,255,255,0.1)',
                    border: 'none', cursor: text.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, color: text.trim() ? '#0E1C12' : '#BDB5A0',
                  }}>
                  <Send size={16} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
