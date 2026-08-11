import { Sparkles } from 'lucide-react'

interface BrandProps {
  light?: boolean
  compact?: boolean
}

export function Brand({ light = false, compact = false }: BrandProps) {
  return (
    <div className={`brand ${light ? 'brand--light' : ''} ${compact ? 'brand--compact' : ''}`}>
      <div className="brand__mark" aria-hidden="true">
        <span>Q</span>
        <Sparkles size={11} strokeWidth={2.5} />
      </div>
      {!compact && (
        <div className="brand__copy">
          <strong>QMO Events</strong>
          <span>NU Manila</span>
        </div>
      )}
    </div>
  )
}
