import { Download, Eye, LoaderCircle, QrCode, ShieldCheck, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'

interface QrCodeImageProps {
  value: string
  label: string
  title: string
  subtitle: string
  badge: string
  filename: string
  variant?: 'event' | 'profile'
  className?: string
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
  context.closePath()
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word
    if (context.measureText(candidate).width <= maxWidth || !line) {
      line = candidate
    } else if (lines.length < maxLines - 1) {
      lines.push(line)
      line = word
    }
  })
  if (line) lines.push(line)

  lines.slice(0, maxLines).forEach((textLine, index) => {
    context.fillText(textLine, x, y + index * lineHeight)
  })
  return y + Math.min(lines.length, maxLines) * lineHeight
}

async function svgToImage(svg: SVGSVGElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', '1200')
  clone.setAttribute('height', '1200')
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)

  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Unable to prepare the QR image.'))
      image.src = objectUrl
    })
    return image
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function saveCanvas(canvas: HTMLCanvasElement, filename: string) {
  return new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Unable to create the QR download.'))
        return
      }
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      const safeFilename = filename
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
      link.download = safeFilename.toLowerCase().endsWith('.png') ? safeFilename : `${safeFilename || 'QMO-QR-card'}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
      resolve()
    }, 'image/png', 1)
  })
}

export function QrCodeImage({ value, label, title, subtitle, badge, filename, variant = 'event', className = '' }: QrCodeImageProps) {
  const qrRef = useRef<SVGSVGElement>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(false)
  const displaySize = variant === 'profile' ? 106 : 82

  useEffect(() => {
    if (!viewOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') setViewOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [viewOpen])

  const downloadCard = async () => {
    if (!qrRef.current || isDownloading) return
    setIsDownloading(true)
    setDownloadError(false)

    try {
      const qrImage = await svgToImage(qrRef.current)
      const canvas = document.createElement('canvas')
      canvas.width = 1800
      canvas.height = 2200
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas is unavailable.')

      const background = context.createLinearGradient(0, 0, 1800, 2200)
      background.addColorStop(0, '#041a42')
      background.addColorStop(0.55, '#073a82')
      background.addColorStop(1, '#0c65be')
      context.fillStyle = background
      context.fillRect(0, 0, 1800, 2200)

      context.globalAlpha = 0.11
      context.strokeStyle = '#ffffff'
      context.lineWidth = 3
      for (let x = -300; x < 2200; x += 180) {
        context.beginPath()
        context.arc(x, 300, 420, 0, Math.PI * 2)
        context.stroke()
      }
      context.globalAlpha = 1

      context.fillStyle = '#f2b81d'
      roundedRect(context, 120, 118, 92, 92, 24)
      context.fill()
      context.fillStyle = '#061d46'
      context.font = '900 39px Arial, sans-serif'
      context.textAlign = 'center'
      context.fillText('NU', 166, 178)

      context.textAlign = 'left'
      context.fillStyle = '#ffffff'
      context.font = '800 34px Arial, sans-serif'
      context.fillText('QUALITY MANAGEMENT OFFICE', 245, 156)
      context.fillStyle = 'rgba(255,255,255,0.68)'
      context.font = '600 24px Arial, sans-serif'
      context.fillText('NATIONAL UNIVERSITY MANILA', 245, 196)

      context.fillStyle = 'rgba(242,184,29,0.16)'
      roundedRect(context, 120, 284, Math.min(context.measureText(badge).width + 100, 900), 62, 31)
      context.fill()
      context.fillStyle = '#ffd664'
      context.font = '800 25px Arial, sans-serif'
      context.letterSpacing = '3px'
      context.fillText(badge.toUpperCase(), 158, 324)
      context.letterSpacing = '0px'

      context.fillStyle = '#ffffff'
      context.font = '800 76px Arial, sans-serif'
      const titleBottom = drawWrappedText(context, title, 120, 446, 1560, 90, 2)
      context.fillStyle = 'rgba(255,255,255,0.72)'
      context.font = '500 31px Arial, sans-serif'
      drawWrappedText(context, subtitle, 120, titleBottom + 12, 1560, 42, 2)

      context.shadowColor = 'rgba(0,10,35,0.3)'
      context.shadowBlur = 50
      context.shadowOffsetY = 20
      context.fillStyle = '#ffffff'
      roundedRect(context, 260, 690, 1280, 1280, 76)
      context.fill()
      context.shadowColor = 'transparent'

      context.drawImage(qrImage, 395, 825, 1010, 1010)
      context.fillStyle = '#0a2d65'
      context.font = '800 29px Arial, sans-serif'
      context.textAlign = 'center'
      context.fillText('SCAN TO VERIFY', 900, 1908)

      context.fillStyle = '#f2b81d'
      roundedRect(context, 120, 2072, 1560, 4, 2)
      context.fill()
      context.fillStyle = 'rgba(255,255,255,0.78)'
      context.font = '600 25px Arial, sans-serif'
      context.fillText('Present this official QR credential at the event check-in desk.', 900, 2140)

      await saveCanvas(canvas, filename)
    } catch {
      setDownloadError(true)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      <section className={`qr-display-card qr-display-card--${variant} ${className}`.trim()}>
        <div className="qr-display-card__code">
          <QRCodeSVG
            ref={qrRef}
            value={value}
            size={displaySize}
            level="H"
            marginSize={3}
            title={label}
            aria-label={label}
          />
        </div>
        <div className="qr-display-card__copy">
          <span>{badge}</span>
          <strong>{title}</strong>
          <small>{subtitle}</small>
          {downloadError ? <em>Download failed. Please retry.</em> : null}
        </div>
        <div className="qr-display-card__actions">
          <button type="button" onClick={() => setViewOpen(true)} aria-label={`View ${label}`}><Eye size={15} /> View</button>
          <button type="button" onClick={() => void downloadCard()} disabled={isDownloading} aria-label={`Download ${label}`}>
            {isDownloading ? <LoaderCircle className="is-spinning" size={15} /> : <Download size={15} />} {isDownloading ? 'Saving' : 'Download'}
          </button>
        </div>
      </section>

      {viewOpen ? createPortal(
        <div className="modal-backdrop qr-view-backdrop" onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && setViewOpen(false)}>
          <section className="qr-view-modal" role="dialog" aria-modal="true" aria-label={label}>
            <button className="modal-close" type="button" onClick={() => setViewOpen(false)} aria-label="Close QR code view"><X size={20} /></button>
            <div className="qr-credential-card">
              <div className="qr-credential-card__brand"><span>NU</span><div><strong>QUALITY MANAGEMENT OFFICE</strong><small>NATIONAL UNIVERSITY MANILA</small></div><ShieldCheck size={25} /></div>
              <span className="qr-credential-card__badge">{badge}</span>
              <h2>{title}</h2>
              <p>{subtitle}</p>
              <div className="qr-credential-card__code"><QRCodeSVG value={value} size={280} level="H" marginSize={3} title={label} /></div>
              <div className="qr-credential-card__footer"><QrCode size={18} /><span><strong>Scan to verify</strong><small>Official QMO digital credential</small></span></div>
            </div>
            <div className="qr-view-modal__actions">
              <p>Download a high-resolution PNG card ready for digital or printed use.</p>
              <button className="button button--primary" type="button" onClick={() => void downloadCard()} disabled={isDownloading}>
                {isDownloading ? <LoaderCircle className="is-spinning" size={17} /> : <Download size={17} />} {isDownloading ? 'Preparing download…' : 'Download high-res card'}
              </button>
            </div>
          </section>
        </div>,
        document.body,
      ) : null}
    </>
  )
}
