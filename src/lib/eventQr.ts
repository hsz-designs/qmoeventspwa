import type { QmoEvent } from '../types'

export function getEventQrValue(event: QmoEvent) {
  return event.qrCodeValue?.trim() || `QMO-EVENT-${event.id}`
}

function getQrCandidates(value: string) {
  const candidates = new Set<string>()
  const addCandidate = (candidate: string | null | undefined) => {
    const normalized = candidate?.trim()
    if (normalized) candidates.add(normalized)
  }

  addCandidate(value)

  try {
    addCandidate(decodeURIComponent(value))
  } catch {
    // A plain QR value does not need URI decoding.
  }

  try {
    const url = new URL(value, window.location.origin)
    const supportedQueryKeys = ['code', 'qr', 'event', 'eventId']
    supportedQueryKeys.forEach((key) => addCandidate(url.searchParams.get(key)))
    addCandidate(url.pathname.split('/').filter(Boolean).at(-1))
  } catch {
    // Non-URL QR values are matched directly.
  }

  return candidates
}

export function findEventByQrValue(events: QmoEvent[], scannedValue: string) {
  const candidates = getQrCandidates(scannedValue)
  return events.find((event) => candidates.has(getEventQrValue(event)) || candidates.has(event.id))
}
