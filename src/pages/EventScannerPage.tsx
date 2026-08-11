import type { IScannerControls } from '@zxing/browser'
import { Camera, Keyboard, LoaderCircle, RotateCcw, ScanLine, ShieldCheck } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'

type ScannerState = 'starting' | 'scanning' | 'error'

function getCameraErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Camera permission was denied. Allow camera access in your browser settings, then try again.'
  }
  if (error instanceof DOMException && error.name === 'NotFoundError') {
    return 'No camera was found on this device.'
  }
  if (!window.isSecureContext) {
    return 'Camera scanning requires a secure HTTPS connection.'
  }
  return 'The camera could not be started. Check that another app is not using it, then try again.'
}

export function EventScannerPage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const handledResultRef = useRef(false)
  const [scannerState, setScannerState] = useState<ScannerState>('starting')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [restartKey, setRestartKey] = useState(0)

  const openRegistration = useCallback((code: string) => {
    const normalizedCode = code.trim()
    if (!normalizedCode) return
    controlsRef.current?.stop()
    navigate(`/events/scan/register?code=${encodeURIComponent(normalizedCode)}`)
  }, [navigate])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let cancelled = false
    handledResultRef.current = false
    setScannerState('starting')
    setCameraError(null)

    const start = async () => {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser')
        if (cancelled) return
        const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 180, delayBetweenScanSuccess: 900 })
        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          video,
          (result, _error, scannerControls) => {
            if (!result || handledResultRef.current) return
            handledResultRef.current = true
            scannerControls.stop()
            openRegistration(result.getText())
          },
        )

        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
        setScannerState('scanning')
      } catch (error) {
        if (cancelled) return
        setScannerState('error')
        setCameraError(getCameraErrorMessage(error))
      }
    }

    void start()
    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [openRegistration, restartKey])

  const submitManualCode = (formEvent: FormEvent) => {
    formEvent.preventDefault()
    openRegistration(manualCode)
  }

  return (
    <div>
      <PageHeader
        eyebrow="QUICK REGISTRATION"
        title="Scan an Event QR"
        description="Point your camera at an official QMO event QR code to continue to registration."
        action={<Link className="button button--outline" to="/">Back to dashboard</Link>}
      />

      <div className="scanner-layout">
        <section className="scanner-card" aria-live="polite">
          <div className="scanner-preview">
            <video ref={videoRef} muted playsInline aria-label="Live camera preview for event QR scanning" />
            <div className="scanner-preview__frame" aria-hidden="true"><span /><span /><span /><span /></div>
            {scannerState === 'starting' ? (
              <div className="scanner-preview__message"><LoaderCircle className="is-spinning" size={27} /><strong>Starting camera…</strong><span>Please allow camera access when prompted.</span></div>
            ) : null}
            {scannerState === 'error' ? (
              <div className="scanner-preview__message scanner-preview__message--error"><Camera size={28} /><strong>Camera unavailable</strong><span>{cameraError}</span></div>
            ) : null}
          </div>

          <div className="scanner-card__footer">
            <div><span className="scanner-card__status"><i className={scannerState === 'scanning' ? 'is-active' : ''} /> {scannerState === 'scanning' ? 'Camera is scanning' : 'Camera scanner'}</span><p>Keep the QR code inside the frame. You’ll be redirected as soon as it is recognized.</p></div>
            {scannerState === 'error' ? <button className="button button--primary button--small" type="button" onClick={() => setRestartKey((key) => key + 1)}><RotateCcw size={16} /> Try camera again</button> : null}
          </div>
        </section>

        <aside className="scanner-help">
          <span className="scanner-help__icon"><ShieldCheck size={23} /></span>
          <h2>Secure event lookup</h2>
          <p>The code is matched against the event QR values already stored in QMO. Scanning never registers you without confirmation.</p>
          <div className="scanner-help__steps">
            <span><strong>1</strong> Scan the event code</span>
            <span><strong>2</strong> Review the event and sessions</span>
            <span><strong>3</strong> Confirm your registration</span>
          </div>

          <form className="manual-code-form" onSubmit={submitManualCode}>
            <label htmlFor="manual-event-code"><Keyboard size={16} /> Enter a code instead</label>
            <div><input id="manual-event-code" value={manualCode} onChange={(inputEvent) => setManualCode(inputEvent.target.value)} placeholder="Paste event QR value" /><button className="button button--outline button--small" type="submit" disabled={!manualCode.trim()}><ScanLine size={15} /> Continue</button></div>
          </form>
        </aside>
      </div>
    </div>
  )
}
