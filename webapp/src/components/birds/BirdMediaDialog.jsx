import { useEffect, useEffectEvent, useRef, useState } from 'react'
import heic2any from 'heic2any'
import {
  deleteBirdMedia,
  loadBirdMedia,
  loadMediaFileUrl,
  saveCertificateLink,
  uploadBirdMedia,
} from '../../utils/media'

const MAX_PHOTOS = 10

function formatFileSize(size) {
  if (!size) return ''
  return `${(size / 1024 / 1024).toFixed(size < 1024 * 1024 ? 1 : 0)} MB`
}

export default function BirdMediaDialog({ birdKey, birdName, mode, isAdmin, token, onClose, onMediaChanged }) {
  const [media, setMedia] = useState({ certificate: null, photos: [] })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [link, setLink] = useState('')
  const [activePhotoIndex, setActivePhotoIndex] = useState(null)
  const [fileUrls, setFileUrls] = useState({})
  const fileInput = useRef(null)

  const refresh = useEffectEvent(async () => {
    setLoading(true)
    setError('')
    try {
      const next = await loadBirdMedia(birdKey, token)
      setMedia(next.media)
      onMediaChanged?.(birdKey, next.media)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    void refresh()
  }, [birdKey, token])

  useEffect(() => {
    let cancelled = false
    const localUrls = []
    const localFiles = [media.certificate, ...(media.photos || [])].filter((file) => file && !file.url)

    async function loadFileUrls() {
      const entries = await Promise.all(
        localFiles.map(async (file) => {
          const url = await loadMediaFileUrl(file.id, token)
          localUrls.push(url)
          return [file.id, url]
        }),
      )
      if (!cancelled) setFileUrls(Object.fromEntries(entries))
    }

    void loadFileUrls()
    return () => {
      cancelled = true
      localUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [media, token])

  async function convertHeicToJpeg(file) {
    const isHeic = /\.(heic|heif)$/i.test(file.name) || ['image/heic', 'image/heif'].includes(file.type)
    if (!isHeic) return file

    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    const convertedBlob = Array.isArray(converted) ? converted[0] : converted
    const jpegName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
    return new File([convertedBlob], jpegName, { type: 'image/jpeg' })
  }

  async function uploadFiles(files) {
    let selectedFiles = Array.from(files || [])
    if (selectedFiles.length === 0) return

    const remaining = MAX_PHOTOS - media.photos.length
    if (mode === 'photo' && selectedFiles.length > remaining) {
      setError(`Je kan nog maximaal ${remaining} foto${remaining === 1 ? '' : "'s"} toevoegen.`)
      return
    }

    setBusy(true)
    setError('')
    try {
      selectedFiles = await Promise.all(selectedFiles.map(convertHeicToJpeg))
      for (const file of selectedFiles) {
        await uploadBirdMedia(birdKey, mode === 'certificate' ? 'certificate' : 'photo', file, token)
      }
      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function addCertificateLink() {
    setBusy(true)
    setError('')
    try {
      await saveCertificateLink(birdKey, link, token)
      setLink('')
      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeFile(kind, fileId) {
    if (!window.confirm('Dit bestand wordt definitief verwijderd. Doorgaan?')) return
    setBusy(true)
    setError('')
    try {
      await deleteBirdMedia(birdKey, kind, fileId, token)
      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const isCertificate = mode === 'certificate'
  const photos = media.photos || []
  const activePhoto = activePhotoIndex === null ? null : photos[activePhotoIndex]

  function fileUrl(file) {
    return file?.url || fileUrls[file?.id] || ''
  }

  function openFile(file) {
    const url = fileUrl(file)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  function handlePhotoKeyDown(event) {
    if (event.key === 'Escape') setActivePhotoIndex(null)
    if (event.key === 'ArrowLeft') setActivePhotoIndex((index) => (index === null ? null : Math.max(0, index - 1)))
    if (event.key === 'ArrowRight') setActivePhotoIndex((index) => (index === null ? null : Math.min(photos.length - 1, index + 1)))
  }

  return (
    <div className="mediaBackdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`mediaDialog ${isCertificate ? 'certificateDialog' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bird-media-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="mediaDialogHead">
          <div>
            <h2 id="bird-media-title">{isCertificate ? 'Certificaat' : 'Foto\'s'}</h2>
            <p>{birdName}</p>
          </div>
          <button type="button" className="closeButton" aria-label="Sluiten" title="Sluiten" onClick={onClose}>
            x
          </button>
        </header>

        {error && <p className="mediaError">{error}</p>}

        {loading ? (
          <p className="mediaEmpty">Media laden...</p>
        ) : (
          <>
            {isCertificate ? (
              <div className="certificateContent">
                {media.certificate ? (
                  <div className="certificateFile">
                    <div>
                      <strong>{media.certificate.name}</strong>
                      <small>{media.certificate.size ? formatFileSize(media.certificate.size) : 'Externe link'}</small>
                    </div>
                    <div className="mediaActions">
                      <button type="button" className="mediaOpenButton" disabled={!fileUrl(media.certificate)} onClick={() => openFile(media.certificate)}>Openen</button>
                      {isAdmin && (
                        <button type="button" className="danger" disabled={busy} onClick={() => removeFile('certificate', media.certificate.id)}>
                          Verwijderen
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mediaEmpty">Nog geen certificaat gekoppeld.</p>
                )}
              </div>
            ) : (
              <>
                <p className="mediaCount">{photos.length}/{MAX_PHOTOS} foto&apos;s</p>
                {photos.length > 0 ? (
                  <div className="photoGrid">
                    {photos.map((photo, index) => (
                      <figure key={photo.id} className="photoTile">
                        <button type="button" className="photoPreviewButton" onClick={() => setActivePhotoIndex(index)}>
                          {fileUrl(photo) && <img src={fileUrl(photo)} alt={photo.name} />}
                        </button>
                        <figcaption>
                          <span title={photo.name}>{photo.name}</span>
                          {isAdmin && (
                            <button type="button" className="danger" disabled={busy} onClick={() => removeFile('photo', photo.id)}>
                              Verwijderen
                            </button>
                          )}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <p className="mediaEmpty">Nog geen foto&apos;s toegevoegd.</p>
                )}
              </>
            )}

            {isAdmin && (
              <div
                className="mediaUpload"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  void uploadFiles(event.dataTransfer.files)
                }}
              >
                <input
                  ref={fileInput}
                  type="file"
                  accept={isCertificate ? 'application/pdf,.pdf' : 'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'}
                  multiple={!isCertificate}
                  hidden
                  onChange={(event) => void uploadFiles(event.target.files)}
                />
                <button type="button" className="primary" disabled={busy || (!isCertificate && photos.length >= MAX_PHOTOS)} onClick={() => fileInput.current?.click()}>
                  {isCertificate ? 'PDF uploaden of vervangen' : "Foto's toevoegen"}
                </button>
                {isCertificate && (
                  <div className="certificateLink">
                    <input value={link} placeholder="Google Drive-link" onChange={(event) => setLink(event.target.value)} />
                    <button type="button" className="ghost" disabled={busy || !link.trim()} onClick={() => void addCertificateLink()}>
                      Link koppelen
                    </button>
                  </div>
                )}
                <p>Sleep bestanden hierheen of gebruik de bestandskiezer. {isCertificate ? 'Alleen PDF, maximaal 20 MB.' : 'HEIC wordt automatisch JPEG. Maximaal 10 MB per foto.'}</p>
              </div>
            )}
          </>
        )}

        {activePhoto && (
          <div className="photoLightbox" role="presentation" onMouseDown={() => setActivePhotoIndex(null)}>
            <div className="photoLightboxContent" role="dialog" aria-modal="true" aria-label={activePhoto.name} tabIndex="-1" onKeyDown={handlePhotoKeyDown} onMouseDown={(event) => event.stopPropagation()}>
              <button type="button" className="closeButton photoLightboxClose" aria-label="Sluiten" title="Sluiten" onClick={() => setActivePhotoIndex(null)}>
                x
              </button>
              {activePhotoIndex > 0 && (
                <button type="button" className="photoLightboxNav previous" aria-label="Vorige foto" title="Vorige foto" onClick={() => setActivePhotoIndex(activePhotoIndex - 1)}>
                  &lt;
                </button>
              )}
              {fileUrl(activePhoto) && <img src={fileUrl(activePhoto)} alt={activePhoto.name} />}
              {activePhotoIndex < photos.length - 1 && (
                <button type="button" className="photoLightboxNav next" aria-label="Volgende foto" title="Volgende foto" onClick={() => setActivePhotoIndex(activePhotoIndex + 1)}>
                  &gt;
                </button>
              )}
              <p>{activePhotoIndex + 1}/{photos.length} - {activePhoto.name}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}