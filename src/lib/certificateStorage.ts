import { supabase } from './supabase'

const DEFAULT_CERTIFICATE_BUCKET = 'QMOStorage'
const SIGNED_URL_LIFETIME_SECONDS = 10 * 60
const STORAGE_OBJECT_PATH = /\/storage\/v1\/(?:object|render\/image)\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/i

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
    const storageLocation = parseStorageObjectPath(new URL(value).pathname)
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
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, SIGNED_URL_LIFETIME_SECONDS)

  if (error) throw new Error(`Unable to open the certificate image: ${error.message}`)
  return data.signedUrl
}
