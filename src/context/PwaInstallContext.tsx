import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type InstallOutcome = 'accepted' | 'dismissed' | 'manual'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

interface PwaInstallContextValue {
  canPrompt: boolean
  isInstalled: boolean
  install: () => Promise<InstallOutcome>
  manualInstructions: string
}

const PwaInstallContext = createContext<PwaInstallContextValue | undefined>(undefined)

function isRunningStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as NavigatorWithStandalone).standalone)
}

function getManualInstructions() {
  const userAgent = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'Tap Share, then choose Add to Home Screen.'
  }
  if (/android/.test(userAgent)) {
    return 'Open the browser menu (⋮), then choose Install app or Add to Home screen.'
  }
  return 'Open your browser menu and choose Install QMO Events or Create shortcut.'
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(isRunningStandalone)

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = () => setIsInstalled(isRunningStandalone())
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }
    const handleInstalled = () => {
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
    setDeferredPrompt(null)
    return choice.outcome
  }, [deferredPrompt])

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      canPrompt: Boolean(deferredPrompt),
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
