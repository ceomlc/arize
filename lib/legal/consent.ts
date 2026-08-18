export const TERMS_URL = 'https://amazegen.com/terms.html'
export const PRIVACY_URL = 'https://amazegen.com/privacy.html'

export const TERMS_VERSION = '2.0'
export const PRIVACY_VERSION = '2.0'

export interface LegalConsentVersions {
  terms_version: string
  privacy_version: string
}

export function hasCurrentLegalConsent(
  consent: LegalConsentVersions | null | undefined
) {
  return consent?.terms_version === TERMS_VERSION
    && consent?.privacy_version === PRIVACY_VERSION
}
