import { useState } from 'react'
import { Download, Smartphone, X } from 'lucide-react'
import { usePwaInstall } from '../context/PwaInstallContext'

const DISMISSED_KEY = 'qmo-install-promotion-dismissed'

export function PwaInstallPromotion() {
  const { canPrompt, install, isInstalled, isIos, manualInstructions } = usePwaInstall()
  const [isDismissed, setIsDismissed] = useState(() => window.sessionStorage.getItem(DISMISSED_KEY) === 'true')
  const [message, setMessage] = useState<string | null>(null)
  const [isPrompting, setIsPrompting] = useState(false)

  if (isInstalled || isDismissed || (!canPrompt && !isIos)) return null

  const dismiss = () => {
    window.sessionStorage.setItem(DISMISSED_KEY, 'true')
    setIsDismissed(true)
  }

  const handleInstall = async () => {
    setIsPrompting(true)
    setMessage(null)

    try {
      const outcome = await install()
      if (outcome === 'manual') {
        setMessage(manualInstructions)
      } else if (outcome === 'dismissed') {
        dismiss()
      }
    } catch {
      setMessage(manualInstructions)
    } finally {
      setIsPrompting(false)
    }
  }

  return (
    <aside className="pwa-install-promotion" aria-label="Install QMO Events">
      <span className="pwa-install-promotion__icon"><Smartphone size={22} /></span>
      <div className="pwa-install-promotion__copy">
        <strong>Add QMO Events to your Home Screen</strong>
        <span>{message ?? (canPrompt ? 'Install the app for faster access and a full-screen experience.' : 'One quick step in Safari will add the app icon to your iPhone.')}</span>
      </div>
      <button className="button button--gold button--small" type="button" onClick={handleInstall} disabled={isPrompting}>
        <Download size={15} /> {isPrompting ? 'Opening…' : canPrompt ? 'Install' : 'Show me how'}
      </button>
      <button className="pwa-install-promotion__close" type="button" onClick={dismiss} aria-label="Dismiss install suggestion">
        <X size={17} />
      </button>
    </aside>
  )
}
