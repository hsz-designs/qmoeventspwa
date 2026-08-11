import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type InstallOutcome = 'accepted' | 'dismissed' | 'manual'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

declare global {
  interface Window {
    __qmoInstallPrompt?: BeforeInstallPromptEvent | null
    __qmoInstallPromptListenerReady?: boolean
  }
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

interface PwaInstallContextValue {
  canPrompt: boolean
  isIos: boolean
  isInstalled: boolean
  install: () => Promise<InstallOutcome>
  manualInstructions: string
}

const PwaInstallContext = createContext<PwaInstallContextValue | undefined>(undefined)

function captureInstallPrompt(event: Event) {
  event.preventDefault()
  window.__qmoInstallPrompt = event as BeforeInstallPromptEvent
}

// Capture the event before React effects run so a fast service-worker startup
// cannot make the install button miss the browser's one-time prompt event.
if (typeof window !== 'undefined' && !window.__qmoInstallPromptListenerReady) {
  window.addEventListener('beforeinstallprompt', captureInstallPrompt)
  window.__qmoInstallPromptListenerReady = true
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
}

function isRunningStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as NavigatorWithStandalone).standalone)
}

function getManualInstructions() {
  if (!window.isSecureContext && !/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
    return 'Installation requires the deployed HTTPS version of QMO Events. It is unavailable from an HTTP link or local network address.'
  }

  const userAgent = navigator.userAgent.toLowerCase()
  if (isIosDevice()) {
    return 'Open this page in Safari, tap Share, choose Add to Home Screen, turn on Open as Web App, then tap Add.'
  }
  if (/android/.test(userAgent)) {
    return 'Open the browser menu (⋮), then choose Install app or Add to Home screen.'
  }
  return 'Open your browser menu and choose Install QMO Events or Create shortcut.'
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => window.__qmoInstallPrompt ?? null)
  const [isInstalled, setIsInstalled] = useState(isRunningStandalone)

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = () => setIsInstalled(isRunningStandalone())
    const handleBeforeInstallPrompt = (event: Event) => {
      captureInstallPrompt(event)
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }
    const handleInstalled = () => {
      window.__qmoInstallPrompt = null
      setDeferredPrompt(null)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    displayMode.addEventListener('change', handleDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      displayMode.removeEventListener('change', handleDisplayModeChange)
    }
  }, [])

  const install = useCallback(async (): Promise<InstallOutcome> => {
    if (!deferredPrompt) return 'manual'

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    window.__qmoInstallPrompt = null
    setDeferredPrompt(null)
    return choice.outcome
  }, [deferredPrompt])

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      canPrompt: Boolean(deferredPrompt),
      isIos: isIosDevice(),
      isInstalled,
      install,
      manualInstructions: getManualInstructions(),
    }),
    [deferredPrompt, install, isInstalled],
  )

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext)
  if (!context) throw new Error('usePwaInstall must be used within PwaInstallProvider')
  return context
}
