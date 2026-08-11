import { Award, CalendarDays, Download, FileCheck2, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { useEventData } from '../context/EventContext'

function formatDate(date?: string) {
  const value = new Date(date ?? '')
  if (Number.isNaN(value.getTime())) return 'Not specified'
  return new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(value)
}

export function CertificatesPage() {
  const { certificates, eventCatalog } = useEventData()

  const handleDownload = (url?: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div>
      <PageHeader eyebrow="ACHIEVEMENTS" title="My Certificates" description="Your verified QMO participation certificates, safe and accessible." />
      <div className="certificate-summary">
        <div className="certificate-summary__seal"><Award size={31} /></div>
        <div><span>DIGITAL PORTFOLIO</span><strong>{certificates.length} certificates earned</strong><p>Every certificate is linked to your NU account and can be verified using its verification code.</p></div>
        <ShieldCheck className="certificate-summary__watermark" size={130} />
      </div>
      <div className="certificate-grid">
        {certificates.map((certificate) => {
          const event = eventCatalog.find((item) => item.id === certificate.eventId)
          const eventTitle = event?.title || `Event #${certificate.eventId}`
          const issuedDate = formatDate(certificate.issuedAt)
          const certificateNumber = certificate.verificationCode || certificate.id

          return (
            <article className="certificate-card" key={certificate.id}>
              <div className="certificate-card__top">
                <div className="certificate-card__brand"><span>NU</span><div><strong>National University</strong><small>Quality Management Office</small></div></div>
                <FileCheck2 size={23} />
              </div>
              <div className="certificate-card__body">
                <span>{certificate.status ? certificate.status.toUpperCase() : 'CERTIFICATE'}</span>
                <h3>{eventTitle}</h3>
                <div><CalendarDays size={15} /> Issued on {issuedDate}</div>
              </div>
              <div className="certificate-card__footer">
                <div><span>Certificate no.</span><strong>{certificateNumber}</strong><small>Issued {issuedDate}</small></div>
                <button className="button button--outline button--small" type="button" onClick={() => handleDownload(certificate.filePath)} title={certificate.filePath ? 'Download certificate' : 'No certificate file available'}>
                  <Download size={16} /> Download
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
