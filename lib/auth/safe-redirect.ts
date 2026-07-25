const DEFAULT_REDIRECT = '/home'

export function getSafeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_REDIRECT
  }

  try {
    const parsed = new URL(value, 'https://arize.local')
    if (parsed.origin !== 'https://arize.local') return DEFAULT_REDIRECT
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return DEFAULT_REDIRECT
  }
}
