export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

export function getUsernameError(value: string): string | null {
  const normalized = normalizeUsername(value)
  if (!normalized) return null
  if (!USERNAME_PATTERN.test(normalized)) {
    return 'Use 3–30 lowercase letters, numbers, or underscores'
  }
  return null
}
