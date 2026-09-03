const MEDIA_API_URL = '/api/media'

async function requestMedia(path, token, options = {}) {
  const response = await fetch(`${MEDIA_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Media-actie kon niet worden uitgevoerd.')
  return data
}

export function mediaFileUrl(fileId) {
  return `${MEDIA_API_URL}/file?id=${encodeURIComponent(fileId)}`
}

export async function loadMediaFileUrl(fileId, token) {
  const response = await fetch(mediaFileUrl(fileId), { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error('Bestand kon niet worden geladen.')
  return URL.createObjectURL(await response.blob())
}

export function loadBirdMedia(birdKey, token) {
  return requestMedia(`?birdKey=${encodeURIComponent(birdKey)}`, token)
}

export function uploadBirdMedia(birdKey, kind, file, token) {
  return requestMedia(`/${kind}`, token, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-Bird-Key': encodeURIComponent(birdKey),
      'X-File-Name': encodeURIComponent(file.name),
    },
    body: file,
  })
}

export function saveCertificateLink(birdKey, url, token) {
  return requestMedia('/certificate-link', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ birdKey, url }),
  })
}

export function deleteBirdMedia(birdKey, kind, fileId, token) {
  return requestMedia('/file', token, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ birdKey, kind, fileId }),
  })
}

export function renameBirdMedia(fromBirdKey, toBirdKey, token) {
  return requestMedia('/rename', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromBirdKey, toBirdKey }),
  })
}

export function archiveBirdMedia(birdKey, bird, token) {
  return requestMedia('/archive-bird', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ birdKey, bird }),
  })
}