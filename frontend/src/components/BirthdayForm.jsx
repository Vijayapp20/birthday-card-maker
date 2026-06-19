import { useState, useRef } from 'react'
import api from '../api'
import { autoCropToFace, PhotoValidationError } from '../utils/faceCrop'
import './BirthdayForm.css'

const RELATIONSHIPS = ['Father', 'Mother', 'Wife', 'Husband', 'Children', 'Lover', 'Friend', 'Brother', 'Sister', 'Other']

export default function BirthdayForm({ onStart }) {
  const [recipientName, setRecipientName]   = useState('')
  const [senderName, setSenderName]         = useState('')
  const [relationship, setRelationship]     = useState('')
  const [isCustomRelationship, setIsCustomRelationship] = useState(false)
  const [messageType, setMessageType]       = useState('custom') // 'custom' | 'ai'
  const [customMessage, setCustomMessage]   = useState('')
  const [photo, setPhoto]                   = useState(null)
  const [photoPreview, setPhotoPreview]     = useState(null)
  const [cropping, setCropping]             = useState(false)
  const [faceDetected, setFaceDetected]     = useState(null) // null = unknown, true/false after crop
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const fileRef = useRef(null)

  const handlePhoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setError('')
    setCropping(true)
    try {
      const { file: croppedFile, previewUrl, faceDetected: detected } = await autoCropToFace(file)
      setPhoto(croppedFile)
      setPhotoPreview(previewUrl)
      setFaceDetected(detected)
    } catch (err) {
      if (err instanceof PhotoValidationError) {
        // Reject the photo entirely — don't fall back, ask for a correct one.
        setError(err.message)
        setPhoto(null)
        setPhotoPreview(null)
        setFaceDetected(null)
      } else {
        console.error('Photo crop failed:', err)
        // Fallback: use the original file as-is
        setPhoto(file)
        setPhotoPreview(URL.createObjectURL(file))
        setFaceDetected(null)
      }
    } finally {
      setCropping(false)
      e.target.value = '' // allow re-selecting the same file after a rejection
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!recipientName.trim()) return setError('Please enter recipient name!')
    if (!senderName.trim())    return setError('Please enter your name!')
    if (!relationship.trim())  return setError(isCustomRelationship ? 'Please type your relationship!' : 'Please select a relationship!')
    if (messageType === 'custom' && !customMessage.trim())
      return setError('Please enter your custom message!')

    setLoading(true)
    try {
      // 1. Upload photo if provided
      let photoUrl = null
      if (photo) {
        const formData = new FormData()
        formData.append('file', photo)
        const res = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        photoUrl = res.data.url
      }

      // 2. Get AI message if selected
      let finalMessage = customMessage
      if (messageType === 'ai') {
        const res = await api.post('/api/generate-message', {
          recipientName,
          senderName,
          relationship,
        })
        finalMessage = res.data.message
      }

      // 3. Save the card so it can be shared via a link
      let shareId = null
      try {
        const saveRes = await api.post('/api/cards', {
          recipientName, senderName, relationship, message: finalMessage, photoUrl
        })
        shareId = saveRes.data.id
      } catch (saveErr) {
        // Sharing is a nice-to-have; don't block card creation if it fails
        console.error('Failed to save shareable card:', saveErr)
      }

      // 4. Start the card
      onStart({ recipientName, senderName, relationship, message: finalMessage, photoUrl, shareId })
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-page">
      <div className="form-bg" />

      <div className="form-card">
        <div className="form-header">
          <span className="form-emoji">🎂</span>
          <h1>BirthDay Wishes</h1>
          <p>Create a personalised animated birthday card!</p>
        </div>

        <form onSubmit={handleSubmit} className="bday-form">

          {/* Recipient */}
          <div className="field">
            <label>🎁 Recipient Name <span>(யாருக்கு?)</span></label>
            <input
              type="text"
              placeholder="e.g. Vijay"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
            />
          </div>

          {/* Sender */}
          <div className="field">
            <label>💌 Your Name <span>(யாரிடமிருந்து?)</span></label>
            <input
              type="text"
              placeholder="e.g. prasanth"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
            />
          </div>

          {/* Relationship */}
          <div className="field">
            <label>💞 Relationship</label>
            <div className="rel-grid">
              {RELATIONSHIPS.map(r => (
                <button
                  key={r}
                  type="button"
                  className={`rel-btn${(r === 'Other' ? isCustomRelationship : (!isCustomRelationship && relationship === r)) ? ' active' : ''}`}
                  onClick={() => {
                    if (r === 'Other') {
                      setIsCustomRelationship(true)
                      setRelationship('')
                    } else {
                      setIsCustomRelationship(false)
                      setRelationship(r)
                    }
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            {isCustomRelationship && (
              <input
                type="text"
                className="custom-rel-input"
                placeholder="Type your relationship (e.g. Cousin, Uncle, Best Friend)"
                value={relationship}
                onChange={e => setRelationship(e.target.value)}
                autoFocus
              />
            )}
          </div>

          {/* Message Type */}
          <div className="field">
            <label>✍️ Birthday Message</label>
            <div className="radio-row">
              <label className={`radio-opt${messageType === 'custom' ? ' active' : ''}`}>
                <input
                  type="radio"
                  name="msgType"
                  value="custom"
                  checked={messageType === 'custom'}
                  onChange={() => setMessageType('custom')}
                />
                ✏️ Custom
              </label>
              <label className={`radio-opt${messageType === 'ai' ? ' active' : ''}`}>
                <input
                  type="radio"
                  name="msgType"
                  value="ai"
                  checked={messageType === 'ai'}
                  onChange={() => setMessageType('ai')}
                />
                🤖 AI Generate
              </label>
            </div>

            {messageType === 'custom' && (
              <textarea
                className="msg-textarea"
                placeholder="Write your heartfelt birthday message here..."
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                rows={4}
              />
            )}
            {messageType === 'ai' && (
              <div className="ai-note">
                ✨ AI will generate a personalised message based on your name, recipient's name & relationship using <b>Groq (Llama3)</b>!
              </div>
            )}
          </div>

          {/* Photo Upload */}
          <div className="field">
            <label>📸 Photo <span>(optional)</span></label>
            <div className="photo-upload" onClick={() => !cropping && fileRef.current.click()}>
              {cropping
                ? <div className="photo-placeholder">
                    <span>⏳</span>
                    <p>Processing photo...</p>
                  </div>
                : photoPreview
                  ? <img src={photoPreview} alt="preview" className="photo-preview" />
                  : <div className="photo-placeholder">
                      <span>📷</span>
                      <p>Click to upload photo</p>
                      <small>JPG, PNG, WEBP · 800–6000px</small>
                    </div>
              }
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                style={{ display: 'none' }}
              />
            </div>
            {photoPreview && !cropping && (
              <>
                <small className="photo-hint">
                  {faceDetected === true && '✅ Face detected — auto-cropped to 800×800'}
                  {faceDetected === false && 'ℹ️ No face detected — center-cropped to 800×800'}
                  {faceDetected === null && '✅ Photo ready'}
                </small>
                <button type="button" className="remove-photo" onClick={() => { setPhoto(null); setPhotoPreview(null); setFaceDetected(null) }}>
                  ✕ Remove photo
                </button>
              </>
            )}
          </div>

          {error && <div className="form-error">⚠️ {error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading
              ? <span className="spinner">⏳ {messageType === 'ai' ? 'AI generating...' : 'Creating...'}</span>
              : '🎉 Create Birthday Card'}
          </button>

        </form>
      </div>
    </div>
  )
}