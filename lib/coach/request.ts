export const MAX_COACH_BODY_BYTES = 64 * 1024
export const MAX_COACH_MESSAGES = 20
export const MAX_COACH_MESSAGE_CHARS = 4_000
export const MAX_COACH_TOTAL_CHARS = 12_000

export type CoachMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type CoachRequestValidation =
  | { ok: true; messages: CoachMessage[] }
  | { ok: false; error: string }

export function validateCoachRequest(value: unknown): CoachRequestValidation {
  if (!value || typeof value !== 'object' || !('messages' in value)) {
    return { ok: false, error: 'A messages array is required' }
  }

  const messages = (value as { messages?: unknown }).messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: 'At least one message is required' }
  }
  if (messages.length > MAX_COACH_MESSAGES) {
    return { ok: false, error: `No more than ${MAX_COACH_MESSAGES} messages are allowed` }
  }

  const validated: CoachMessage[] = []
  let totalChars = 0

  for (const message of messages) {
    if (!message || typeof message !== 'object') {
      return { ok: false, error: 'Every message must be an object' }
    }

    const { role, content } = message as { role?: unknown; content?: unknown }
    if (role !== 'user' && role !== 'assistant') {
      return { ok: false, error: 'Message roles must be user or assistant' }
    }
    if (typeof content !== 'string' || !content.trim()) {
      return { ok: false, error: 'Message content must be a non-empty string' }
    }
    if (content.length > MAX_COACH_MESSAGE_CHARS) {
      return { ok: false, error: `Messages cannot exceed ${MAX_COACH_MESSAGE_CHARS} characters` }
    }

    totalChars += content.length
    if (totalChars > MAX_COACH_TOTAL_CHARS) {
      return { ok: false, error: `Conversation context cannot exceed ${MAX_COACH_TOTAL_CHARS} characters` }
    }
    validated.push({ role, content: content.trim() })
  }

  if (validated.at(-1)?.role !== 'user') {
    return { ok: false, error: 'The final message must be from the user' }
  }

  return { ok: true, messages: validated }
}
