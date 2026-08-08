import { useState, useRef } from 'react'
import api from '../api'
import { autoCropToFace, PhotoValidationError } from '../utils/faceCrop'
import TemplateSelect from './TemplateSelect'
import ManualCropModal from './ManualCropModal'
import './BirthdayForm.css'

const OCCASIONS = [
  { key: 'birthday',    label: '🎂 Birthday'    },
  { key: 'anniversary', label: '💍 Anniversary'  },
  { key: 'graduation',  label: '🎓 Graduation'   },
  { key: 'newjob',      label: '💼 New Job'      },
  { key: 'newhome',     label: '🏠 New Home'     },
  { key: 'babyshower',  label: '👶 Baby Shower'  },
  { key: 'engagement',  label: '💑 Engagement'   },
  { key: 'custom',      label: '🎉 Custom'       },
]

const RELATIONSHIPS = ['Father', 'Mother', 'Wife', 'Husband', 'Children', 'Lover', 'Friend', 'Brother', 'Sister', 'Other']

// Auto-pick a character based on relationship — no manual selection needed in the UI.
const RELATIONSHIP_CHARACTER_MAP = {
  Father: 'cilukba', Mother: 'cilukba',
  Wife: 'mndkat', Husband: 'mndkat', Lover: 'mndkat',
  Children: 'pandaputih',
  Friend: 'g5',
  Brother: 'pusn', Sister: 'pusn',
  Other: 'g5',
}

const getCharacterForRelationship = (rel) => {
  if (RELATIONSHIP_CHARACTER_MAP[rel]) return RELATIONSHIP_CHARACTER_MAP[rel]
  const lower = (rel || '').toLowerCase()
  if (/husband|wife|lover|boyfriend|girlfriend|spouse|fiance/.test(lower)) return 'mndkat'
  if (/brother|sister|sibling/.test(lower)) return 'pusn'
  if (/mother|father|parent|mom|dad/.test(lower)) return 'cilukba'
  if (/child|son|daughter|kid/.test(lower)) return 'pandaputih'
  if (/friend/.test(lower)) return 'g5'
  return 'g5'
}

export default function BirthdayForm({ onStart }) {
  const [recipientName, setRecipientName]           = useState('')
  const [senderName, setSenderName]                 = useState('')
  const [relationship, setRelationship]             = useState('')
  const [isCustomRelationship, setIsCustomRelationship] = useState(false)
  const [occasionType, setOccasionType]             = useState('birthday')
  const [customOccasion, setCustomOccasion]         = useState('')
  const [messageType, setMessageType]               = useState('custom')
  const [customMessage, setCustomMessage]           = useState('')
  const [photo, setPhoto]                           = useState(null)
  const [photoPreview, setPhotoPreview]             = useState(null)
  const [originalPhotoFile, setOriginalPhotoFile]   = useState(null) // kept so "Adjust manually" can re-crop from the untouched source
  const [showManualCrop, setShowManualCrop]         = useState(false)
  const [cropping, setCropping]                     = useState(false)
  const [faceDetected, setFaceDetected]             = useState(null)
  const [loading, setLoading]                       = useState(false)
  const [error, setError]                           = useState('')
  const [preparedData, setPreparedData]             = useState(null) // set once submit succeeds; triggers template picker
  const [savingTemplate, setSavingTemplate]         = useState(false)
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
      setOriginalPhotoFile(file)
    } catch (err) {
      if (err instanceof PhotoValidationError) {
        setError(err.message)
        setPhoto(null); setPhotoPreview(null); setFaceDetected(null); setOriginalPhotoFile(null)
      } else {
        setPhoto(file)
        setPhotoPreview(URL.createObjectURL(file))
        setFaceDetected(null)
        setOriginalPhotoFile(file)
      }
    } finally {
      setCropping(false)
      e.target.value = ''
    }
  }

  const handleManualCropConfirm = ({ file: croppedFile, previewUrl }) => {
    setPhoto(croppedFile)
    setPhotoPreview(previewUrl)
    setFaceDetected('manual') // preview hint below shows a different message for this
    setShowManualCrop(false)
  }

  const getFinalOccasion = () =>
    occasionType === 'custom' ? (customOccasion.trim() || 'custom') : occasionType

  // Saves the card with the given template and hands off to the parent.
  const finalizeCard = async (data, template) => {
    setSavingTemplate(true)
    let shareId = null
    try {
      const saveRes = await api.post('/api/cards', { ...data, template })
      shareId = saveRes.data.id
    } catch (saveErr) {
      console.error('Failed to save shareable card:', saveErr)
    } finally {
      setSavingTemplate(false)
    }
    onStart({ ...data, shareId, template })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!recipientName.trim()) return setError('Please enter recipient name!')
    if (!senderName.trim())    return setError('Please enter your name!')
    if (!relationship.trim())  return setError(isCustomRelationship ? 'Please type your relationship!' : 'Please select a relationship!')
    if (occasionType === 'custom' && !customOccasion.trim()) return setError('Please type your occasion!')
    if (messageType === 'custom' && !customMessage.trim())   return setError('Please enter your message!')

    setLoading(true)
    try {
      let photoUrl = null
      if (photo) {
        const formData = new FormData()
        formData.append('file', photo)
        const res = await api.post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        photoUrl = res.data.url
      }

      let finalMessage = customMessage
      if (messageType === 'ai') {
        const res = await api.post('/api/generate-message', {
          recipientName, senderName, relationship, occasionType: getFinalOccasion(),
        })
        finalMessage = res.data.message
      }

      const data = {
        recipientName, senderName, relationship,
        message: finalMessage, photoUrl,
        characterGif: getCharacterForRelationship(relationship),
        occasionType: getFinalOccasion(),
      }

      if (photoUrl) {
        // Photo uploaded → go straight to the photo/slideshow template, no need to ask.
        await finalizeCard(data, 'photo')
      } else {
        // No photo → let them pick a template (e.g. the letter style, which needs no photo).
        setPreparedData(data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChooseTemplate = (template) => finalizeCard(preparedData, template)

  if (preparedData) {
    return (
      <TemplateSelect
        recipientName={preparedData.recipientName}
        onChoose={handleChooseTemplate}
        onBack={() => setPreparedData(null)}
        saving={savingTemplate}
      />
    )
  }

  return (
    <div className="form-page">
      <div className="form-bg" />
      <div className="form-card">
        <div className="form-header">
          <span className="form-emoji">🎉</span>
          <h1>Celebration Wishes</h1>
          <p>Create a personalised animated celebration card!</p>
        </div>

        <form onSubmit={handleSubmit} className="bday-form">

          {/* Occasion */}
          <div className="field">
            <label>🎉 Occasion</label>
            <div className="occasion-grid">
              {OCCASIONS.map(o => (
                <button key={o.key} type="button"
                  className={`occasion-btn${occasionType === o.key ? ' active' : ''}`}
                  onClick={() => setOccasionType(o.key)}>
                  {o.label}
                </button>
              ))}
            </div>
            {occasionType === 'custom' && (
              <input type="text" className="custom-rel-input"
                placeholder="e.g. Farewell, Retirement, Festival..."
                value={customOccasion}
                onChange={e => setCustomOccasion(e.target.value)}
                autoFocus />
            )}
          </div>

          {/* Recipient */}
          <div className="field">
            <label>🎁 Recipient Name <span>(யாருக்கு?)</span></label>
            <input type="text" placeholder="e.g. Priya"
              value={recipientName} onChange={e => setRecipientName(e.target.value)} />
          </div>

          {/* Sender */}
          <div className="field">
            <label>💌 Your Name <span>(யாரிடமிருந்து?)</span></label>
            <input type="text" placeholder="e.g. Rahul"
              value={senderName} onChange={e => setSenderName(e.target.value)} />
          </div>

          {/* Relationship */}
          <div className="field">
            <label>💞 Relationship</label>
            <div className="rel-grid">
              {RELATIONSHIPS.map(r => (
                <button key={r} type="button"
                  className={`rel-btn${(r === 'Other' ? isCustomRelationship : (!isCustomRelationship && relationship === r)) ? ' active' : ''}`}
                  onClick={() => {
                    if (r === 'Other') { setIsCustomRelationship(true); setRelationship('') }
                    else { setIsCustomRelationship(false); setRelationship(r) }
                  }}>
                  {r}
                </button>
              ))}
            </div>
            {isCustomRelationship && (
              <input type="text" className="custom-rel-input"
                placeholder="Type your relationship (e.g. Cousin, Uncle, Best Friend)"
                value={relationship} onChange={e => setRelationship(e.target.value)} autoFocus />
            )}
          </div>

          {/* Message */}
          <div className="field">
            <label>✍️ Message</label>
            <div className="radio-row">
              <label className={`radio-opt${messageType === 'custom' ? ' active' : ''}`}>
                <input type="radio" name="msgType" value="custom"
                  checked={messageType === 'custom'} onChange={() => setMessageType('custom')} />
                ✏️ Custom
              </label>
              <label className={`radio-opt${messageType === 'ai' ? ' active' : ''}`}>
                <input type="radio" name="msgType" value="ai"
                  checked={messageType === 'ai'} onChange={() => setMessageType('ai')} />
                🤖 AI Generate
              </label>
            </div>
            {messageType === 'custom' && (
              <textarea className="msg-textarea"
                placeholder="Write your heartfelt message here..."
                value={customMessage} onChange={e => setCustomMessage(e.target.value)} rows={4} />
            )}
            {messageType === 'ai' && (
              <div className="ai-note">
                ✨ AI will generate a personalised message based on the occasion, names & relationship using <b>Groq (Llama3)</b>!
              </div>
            )}
          </div>

          {/* Photo */}
          <div className="field">
            <label>📸 Photo <span>(optional)</span></label>
            <div className="photo-upload" onClick={() => !cropping && fileRef.current.click()}>
              {cropping
                ? <div className="photo-placeholder"><span>⏳</span><p>Processing photo...</p></div>
                : photoPreview
                  ? <img src={photoPreview} alt="preview" className="photo-preview" />
                  : <div className="photo-placeholder">
                      <span>📷</span>
                      <p>Click to upload photo</p>
                      <small>JPG, PNG, WEBP · 800–6000px</small>
                    </div>
              }
              <input ref={fileRef} type="file" accept="image/*"
                onChange={handlePhoto} style={{ display: 'none' }} />
            </div>
            {photoPreview && !cropping && (
              <>
                <small className="photo-hint">
                  {faceDetected === true   && '✅ Face detected — auto-cropped to 800×800'}
                  {faceDetected === false  && 'ℹ️ No face detected — center-cropped to 800×800'}
                  {faceDetected === 'manual' && '🎯 Manually adjusted'}
                  {faceDetected === null   && '✅ Photo ready'}
                </small>
                <div className="photo-actions">
                  <button type="button" className="adjust-photo"
                    onClick={() => setShowManualCrop(true)}>
                    🎯 Adjust manually
                  </button>
                  <button type="button" className="remove-photo"
                    onClick={() => { setPhoto(null); setPhotoPreview(null); setFaceDetected(null); setOriginalPhotoFile(null) }}>
                    ✕ Remove photo
                  </button>
                </div>
              </>
            )}
          </div>

          {error && <div className="form-error">⚠️ {error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading
              ? <span className="spinner">⏳ {messageType === 'ai' ? 'AI generating...' : 'Creating...'}</span>
              : '🎉 Create Celebration Card'}
          </button>

        </form>
      </div>

      {showManualCrop && originalPhotoFile && (
        <ManualCropModal
          file={originalPhotoFile}
          onCancel={() => setShowManualCrop(false)}
          onConfirm={handleManualCropConfirm}
        />
      )}
    </div>
  )
}
