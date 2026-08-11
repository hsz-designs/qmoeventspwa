import { useState } from 'react'
import { Check, Download } from 'lucide-react'
import { usePwaInstall } from '../context/PwaInstallContext'

export function PwaInstallAction({ placement }: { placement: 'login' | 'settings' }) {
  const { canPrompt, install, isInstalled, manualInstructions } = usePwaInstall()
  const [message, setMessage] = useState<string | null>(null)

  if (isInstalled) {
    return placement === 'settings' ? <span className="status status--attended"><Check size={12} /> Installed</span> : null
  }

  const handleInstall = async () => {
    try {
      const outcome = await install()
      if (outcome === 'manual') setMessage(manualInstructions)
      if (outcome === 'dismissed') setMessage('Installation was cancelled. You can try again whenever you are ready.')
    } catch {
      setMessage(manualInstructions)
    }
  }

  return (
    <div className={`pwa-install-action pwa-install-action--${placement}`}>
      <button className={placement === 'login' ? 'button button--outline' : 'button button--small button--outline'} type="button" onClick={handleInstall}>
        <Download size={16} /> {canPrompt ? 'Install app' : 'How to install'}
      </button>
      {message && <span className="pwa-install-action__help" role="status">{message}</span>}
    </div>
  )
}
