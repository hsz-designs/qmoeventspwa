import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Award, CalendarDays, Download, Eye, FileCheck2, ImageIcon, ImageOff, LoaderCircle, ShieldCheck, X } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { useEventData } from '../context/EventContext'
import { downloadCertificateFile, getCertificateFileUrl } from '../lib/certificateStorage'
import type { Certificate } from '../types'

function formatDate(date?: string) {
  const value = new Date(date ?? '')
  if (Number.isNaN(value.getTime())) return 'Not specified'
  return new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(value)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The certificate image could not be loaded.'
}

interface CertificateCardProps {
  certificate: Certificate
  eventTitle: string
}

function CertificateCard({ certificate, eventTitle }: CertificateCardProps) {
  const [fileUrl, setFileUrl] = useState<string>()
  const [fileError, setFileError] = useState<string>()
  const [imageError, setImageError] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string>()
  const issuedDate = formatDate(certificate.issuedAt)
  const certificateNumber = certificate.verificationCode || certificate.id
  const hasFile = Boolean(certificate.filePath)

  useEffect(() => {
    let active = true
    setFileUrl(undefined)
    setFileError(undefined)
    setImageError(false)

    if (!certificate.filePath) return () => { active = false }

    void getCertificateFileUrl(certificate.filePath)
      .then((url) => {
        if (active) setFileUrl(url)
      })
      .catch((error: unknown) => {
        if (active) setFileError(getErrorMessage(error))
      })

    return () => { active = false }
  }, [certificate.filePath])

  useEffect(() => {
    if (!viewOpen) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [viewOpen])

  const handleDownload = async () => {
    if (!certificate.filePath || isDownloading) return
    setIsDownloading(true)
    setDownloadError(undefined)
    try {
      await downloadCertificateFile(certificate.filePath, `${eventTitle} - ${certificateNumber}`)
    } catch (error) {
      setDownloadError(getErrorMessage(error))
    } finally {
      setIsDownloading(false)
    }
  }

  const canView = Boolean(fileUrl && !imageError)

  return (
    <article className="certificate-card">
      <div className="certificate-card__top">
        <div className="certificate-card__brand"><span>NU</span><div><strong>National University</strong><small>Quality Management Office</small></div></div>
        <FileCheck2 size={23} />
      </div>

      <div className="certificate-card__preview">
        {fileUrl && !imageError ? (
          <img src={fileUrl} alt={`Certificate for ${eventTitle}`} loading="lazy" onError={() => setImageError(true)} />
        ) : hasFile && !fileError && !imageError ? (
          <div className="certificate-card__preview-state"><LoaderCircle className="is-spinning" size={24} /><span>Loading certificate preview…</span></div>
        ) : (
          <div className="certificate-card__preview-state certificate-card__preview-state--empty">
            {hasFile ? <ImageOff size={26} /> : <ImageIcon size={26} />}
            <span>{hasFile ? 'Certificate image unavailable' : 'No certificate image attached'}</span>
          </div>
        )}
      </div>

      <div className="certificate-card__body">
        <span>{certificate.status ? certificate.status.toUpperCase() : 'CERTIFICATE'}</span>
        <h3>{eventTitle}</h3>
        <div><CalendarDays size={15} /> Issued on {issuedDate}</div>
      </div>

      <div className="certificate-card__footer">
        <div><span>Certificate no.</span><strong>{certificateNumber}</strong><small>Issued {issuedDate}</small></div>
        <div className="certificate-card__actions">
          <button className="button button--ghost button--small" type="button" onClick={() => setViewOpen(true)} disabled={!canView} title={canView ? 'View certificate image' : 'No certificate image available to view'}>
            <Eye size={16} /> View
          </button>
          <button className="button button--outline button--small" type="button" onClick={() => void handleDownload()} disabled={!hasFile || isDownloading} title={hasFile ? 'Download certificate image' : 'No certificate image available to download'}>
            {isDownloading ? <LoaderCircle className="is-spinning" size={16} /> : <Download size={16} />} {isDownloading ? 'Downloading…' : 'Download'}
          </button>
        </div>
        {downloadError ? <p className="certificate-card__error" role="alert">{downloadError}</p> : null}
      </div>

      {viewOpen && fileUrl ? createPortal(
        <div className="modal-backdrop certificate-view-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setViewOpen(false)}>
          <section className="certificate-view-modal" role="dialog" aria-modal="true" aria-labelledby={`certificate-view-title-${certificate.id}`}>
            <button className="modal-close" type="button" onClick={() => setViewOpen(false)} aria-label="Close certificate view"><X size={20} /></button>
            <div className="certificate-view-modal__heading">
              <span>CERTIFICATE PREVIEW</span>
              <h2 id={`certificate-view-title-${certificate.id}`}>{eventTitle}</h2>
              <p>{certificate.recipientName} · Issued {issuedDate}</p>
            </div>
            <div className="certificate-view-modal__image">
              <img src={fileUrl} alt={`Certificate for ${eventTitle}`} />
            </div>
            <div className="certificate-view-modal__actions">
              <small>Certificate no. {certificateNumber}</small>
              <button className="button button--primary" type="button" onClick={() => void handleDownload()} disabled={isDownloading}>
                {isDownloading ? <LoaderCircle className="is-spinning" size={17} /> : <Download size={17} />} {isDownloading ? 'Downloading…' : 'Download certificate'}
              </button>
            </div>
            {downloadError ? <p className="certificate-view-modal__error" role="alert">{downloadError}</p> : null}
          </section>
        </div>,
        document.body,
      ) : null}
    </article>
  )
}

export function CertificatesPage() {
  const { certificates, eventCatalog, isLoading } = useEventData()

  return (
    <div>
      <PageHeader eyebrow="ACHIEVEMENTS" title="My Certificates" description="Your verified QMO participation certificates, safe and accessible." />
      <div className="certificate-summary">
        <div className="certificate-summary__seal"><Award size={31} /></div>
        <div><span>DIGITAL PORTFOLIO</span><strong>{certificates.length} certificates earned</strong><p>Every certificate is linked to your NU account and can be verified using its verification code.</p></div>
        <ShieldCheck className="certificate-summary__watermark" size={130} />
      </div>

      {isLoading ? (
        <div className="empty-state"><LoaderCircle className="is-spinning" size={28} /><h3>Loading your certificates…</h3></div>
      ) : certificates.length ? (
        <div className="certificate-grid">
          {certificates.map((certificate) => {
            const event = eventCatalog.find((item) => item.id === certificate.eventId)
            return <CertificateCard certificate={certificate} eventTitle={event?.title || `Event #${certificate.eventId}`} key={certificate.id} />
          })}
        </div>
      ) : (
        <div className="empty-state"><Award size={30} /><h3>No certificates yet</h3><p>Your issued certificates will appear here.</p></div>
      )}
    </div>
  )
}
