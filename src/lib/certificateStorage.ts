import { supabase } from './supabase'

const DEFAULT_CERTIFICATE_BUCKET = 'QMOStorage'
const STORAGE_OBJECT_PATH = /\/storage\/v1\/(?:object|render\/image)\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/i
const PUBLIC_STORAGE_URL_PATH = /\/storage\/v1\/(?:object|render\/image)\/public\//i

interface StorageObjectLocation {
  bucket: string
  objectPath: string
}

type CertificateFileLocation =
  | { kind: 'direct'; directUrl: string }
  | { kind: 'storage'; storageLocation: StorageObjectLocation }

function decodePathPart(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function parseStorageObjectPath(pathname: string): StorageObjectLocation | null {
  const match = pathname.match(STORAGE_OBJECT_PATH)
  if (!match) return null
  return {
    bucket: decodePathPart(match[1]),
    objectPath: match[2].split('/').map(decodePathPart).join('/'),
  }
}

function getCertificateFileLocation(filePath: string): CertificateFileLocation {
  const value = filePath.trim()
  if (!value) throw new Error('No certificate image is available.')

  if (/^(data:|blob:)/i.test(value)) return { kind: 'direct', directUrl: value }

  if (/^https?:\/\//i.test(value)) {
    const pathname = new URL(value).pathname
    if (PUBLIC_STORAGE_URL_PATH.test(pathname)) return { kind: 'direct', directUrl: value }
    const storageLocation = parseStorageObjectPath(pathname)
    return storageLocation ? { kind: 'storage', storageLocation } : { kind: 'direct', directUrl: value }
  }

  if (value.startsWith('//')) return { kind: 'direct', directUrl: `https:${value}` }

  const normalizedPath = value.split(/[?#]/, 1)[0].replace(/^\/+/, '')
  const storageLocation = parseStorageObjectPath(`/${normalizedPath}`)
  if (storageLocation) return { kind: 'storage', storageLocation }

  const pathParts = normalizedPath.split('/').filter(Boolean).map(decodePathPart)
  const hasBucketPrefix = pathParts[0]?.toLowerCase() === DEFAULT_CERTIFICATE_BUCKET.toLowerCase()
  return {
    kind: 'storage',
    storageLocation: {
      bucket: hasBucketPrefix ? pathParts.shift()! : DEFAULT_CERTIFICATE_BUCKET,
      objectPath: pathParts.join('/'),
    },
  }
}

export async function getCertificateFileUrl(filePath: string): Promise<string> {
  const location = getCertificateFileLocation(filePath)
  if (location.kind === 'direct') return location.directUrl
  if (!supabase) throw new Error('Supabase Storage is not configured.')
  if (!location.storageLocation.objectPath) throw new Error('The certificate image path is invalid.')

  const { bucket, objectPath } = location.storageLocation
  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath)
  if (!data.publicUrl) throw new Error('Unable to create the public certificate image URL.')
  return data.publicUrl
}

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

function sanitizeFilename(value: string) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim() || 'QMO-certificate'
}

function getDownloadFilename(filename: string, fileUrl: string, contentType: string) {
  const safeFilename = sanitizeFilename(filename)
  if (/\.[a-z0-9]{2,5}$/i.test(safeFilename)) return safeFilename

  let urlExtension: string | undefined
  try {
    urlExtension = new URL(fileUrl).pathname.match(/\.([a-z0-9]{2,5})$/i)?.[1]
  } catch {
    // The response content type remains a reliable fallback for non-standard URLs.
  }

  const normalizedContentType = contentType.split(';', 1)[0].toLowerCase()
  const extension = urlExtension || CONTENT_TYPE_EXTENSIONS[normalizedContentType] || 'png'
  return `${safeFilename}.${extension}`
}

export async function downloadCertificateFile(filePath: string, filename: string): Promise<void> {
  const fileUrl = await getCertificateFileUrl(filePath)
  const response = await fetch(fileUrl)
  if (!response.ok) throw new Error(`Unable to download the certificate image (${response.status}).`)

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = getDownloadFilename(filename, fileUrl, blob.type)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}
