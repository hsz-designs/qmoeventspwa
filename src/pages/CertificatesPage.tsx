import { Award, CalendarDays, Download, FileCheck2, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { useEventData } from '../context/EventContext'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`))
}

export function CertificatesPage() {
  const { certificates } = useEventData()

  const handleDownload = (url?: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div>
      <PageHeader eyebrow="ACHIEVEMENTS" title="My Certificates" description="Your verified QMO participation certificates, safe and accessible." />
      <div className="certificate-summary">
        <div className="certificate-summary__seal"><Award size={31} /></div>
        <div><span>DIGITAL PORTFOLIO</span><strong>{certificates.length} certificates earned</strong><p>Every certificate is linked to your NU account and can be verified using its certificate number.</p></div>
        <ShieldCheck className="certificate-summary__watermark" size={130} />
      </div>
      <div className="certificate-grid">
        {certificates.map((certificate) => (
          <article className="certificate-card" key={certificate.id}>
            <div className="certificate-card__top">
              <div className="certificate-card__brand"><span>NU</span><div><strong>National University</strong><small>Quality Management Office</small></div></div>
              <FileCheck2 size={23} />
            </div>
            <div className="certificate-card__body">
              <span>CERTIFICATE OF PARTICIPATION</span>
              <h3>{certificate.title}</h3>
              <div><CalendarDays size={15} /> Event held on {formatDate(certificate.eventDate)}</div>
            </div>
            <div className="certificate-card__footer">
              <div><span>Certificate no.</span><strong>{certificate.certificateNumber}</strong><small>Issued {formatDate(certificate.issuedDate)}</small></div>
              <button className="button button--outline button--small" type="button" onClick={() => handleDownload(certificate.downloadUrl)} title={certificate.downloadUrl ? 'Download certificate' : 'Connect Supabase storage to enable downloads'}>
                <Download size={16} /> Download
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
