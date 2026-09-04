const SAFE_TEXT = /^[a-zA-Z0-9_.:-]{1,80}$/

type ErrorLike = {
  name?: unknown
  type?: unknown
  code?: unknown
  param?: unknown
  statusCode?: unknown
}

function safeText(value: unknown) {
  return typeof value === 'string' && SAFE_TEXT.test(value) ? value : undefined
}

/**
 * Keep billing diagnostics useful without logging provider payloads, request
 * headers, customer details, or error messages that may contain user data.
 */
export function safeBillingError(error: unknown) {
  const value = error && typeof error === 'object' ? error as ErrorLike : {}
  const statusCode = typeof value.statusCode === 'number'
    && Number.isInteger(value.statusCode)
    && value.statusCode >= 100
    && value.statusCode <= 599
    ? value.statusCode
    : undefined

  return {
    name: safeText(value.name) ?? (error instanceof Error ? 'Error' : 'UnknownError'),
    type: safeText(value.type),
    code: safeText(value.code),
    param: safeText(value.param),
    statusCode,
  }
}

export function billingFailureLabel(error: unknown) {
  const details = safeBillingError(error)
  return details.code ?? details.type ?? details.name
}
