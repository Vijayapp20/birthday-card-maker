import { useState, useRef } from 'react'
import api from '../api'
import { autoCropToFace, PhotoValidationError } from '../utils/faceCrop'
import './BirthdayForm.css'

// GIF character options for the 5th slide
import pusn     from '../assets/pusn.gif'
import mikir    from '../assets/mikir.gif'
import cilukba  from '../assets/cilukba.gif'
import g5       from '../assets/g5.gif'
import mndkat   from '../assets/mndkat.gif'
import pandaputih from '../assets/pandaputih.gif'
import pandapanah from '../assets/pandapanah.gif'

const CHARACTERS = [
  { key: 'g5',         src: g5,         label: '🎉 Party'   },
  { key: 'pusn',       src: pusn,       label: '🐱 Cute'    },
  { key: 'mikir',      src: mikir,      label: '🤔 Think'   },
  { key: 'cilukba',    src: cilukba,    label: '👀 Peek'    },
  { key: 'mndkat',     src: mndkat,     label: '🥰 Love'    },
  { key: 'pandaputih', src: pandaputih, label: '🐼 Panda'   },
  { key: 'pandapanah', src: pandapanah, label: '🏹 Arrow'   },
]

const OCCASIONS = [
  { key: 'birthday',   label: '🎂 Birthday'    },
  { key: 'anniversary',label: '💍 Anniversary'  },
  { key: 'graduation', label: '🎓 Graduation'   },
  { key: 'newjob',     label: '💼 New Job'      },
  { key: 'babyshower', label: '👶 Baby Shower'  },
  { key: 'newhome',    label: '🏠 New Home'     },
  { key: 'engagement', label: '💑 Engagement'   },
  { key: 'custom',     label: '🎉 Custom'       },
]

const RELATIONSHIPS = ['Father', 'Mother', 'Wife', 'Husband', 'Children', 'Lover', 'Friend', 'Brother', 'Sister', 'Other']

const OCCASIONS = [
  { key: 'birthday',    emoji: '🎂', label: 'Birthday'        },
  { key: 'anniversary', emoji: '💍', label: 'Anniversary'     },
  { key: 'graduation',  emoji: '🎓', label: 'Graduation'      },
  { key: 'newjob',      emoji: '💼', label: 'New Job'         },
  { key: 'babyshower',  emoji: '👶', label: 'Baby Shower'     },
]

export default function BirthdayForm({ onStart }) {
  const [recipientName, setRecipientName]   = useState('')
  const [senderName, setSenderName]         = useState('')
  const [relationship, setRelationship]     = useState('')
  const [isCustomRelationship, setIsCustomRelationship] = useState(false)
  const [messageType, setMessageType]       = useState('custom')
  const [customMessage, setCustomMessage]   = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState('g5') // default: party gif
  const [occasionType, setOccasionType]           = useState('birthday')
  const [customOccasion, setCustomOccasion]       = useState('')
  const [isCustomOccasion, setIsCustomOccasion]     = useState(false)
  const [customOccasion, setCustomOccasion]         = useState('')
  const [occasion, setOccasion]                     = useState('birthday')
  const [photo, setPhoto]                   = useState(null)
  const [photoPreview, setPhotoPreview]     = useState(null)
  const [cropping, setCropping]             = useState(false)
  const [faceDetected, setFaceDetected]     = useState(null)
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
    if (!occasionType.trim())  return setError(isCustomOccasion ? 'Please type your occasion!' : 'Please select an occasion!')
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
          occasionType: occasionType === 'custom' ? (customOccasion || 'custom') : occasionType,
        })
        finalMessage = res.data.message
      }

      // 3. Save the card so it can be shared via a link
      let shareId = null
      try {
        const saveRes = await api.post('/api/cards', {
          recipientName, senderName, relationship, message: finalMessage, photoUrl,
          characterGif: selectedCharacter,
          occasionType: occasionType === 'custom' ? (customOccasion || 'custom') : occasionType,
          occasionType: occasionType === 'custom' ? (customOccasion || 'custom') : occasionType: occasion
        })
        shareId = saveRes.data.id
      } catch (saveErr) {
        console.error('Failed to save shareable card:', saveErr)
      }

      // 4. Start the card
      onStart({ recipientName, senderName, relationship, message: finalMessage, photoUrl, shareId, characterGif: selectedCharacter, occasionType: occasion })
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
          <p>Create a personalised animated celebration card!</p>
        </div>

        <form onSubmit={handleSubmit} className="bday-form">

          {/* Occasion */}
          <div className="field">
            <label>🎉 Occasion Type</label>
            <div className="occasion-grid">
              {OCCASIONS.map(oc => (
                <button
                  key={oc.key}
                  type="button"
                  className={`occasion-btn${occasion === oc.key ? ' active' : ''}`}
                  onClick={() => setOccasion(oc.key)}
                >
                  <span className="occasion-emoji">{oc.emoji}</span>
                  <span>{oc.label}</span>
                </button>
              ))}
            </div>
          </div>

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

          {/* Occasion Type */}
          <div className="field">
            <label>🎉 Occasion</label>
            <div className="occasion-grid">
              {OCCASIONS.map(o => (
                <button
                  key={o.key}
                  type="button"
                  className={`occasion-btn${(o.key === 'custom' ? isCustomOccasion : (!isCustomOccasion && occasionType === o.key)) ? ' active' : ''}`}
                  onClick={() => {
                    if (o.key === 'custom') {
                      setIsCustomOccasion(true)
                      setOccasionType('')
                    } else {
                      setIsCustomOccasion(false)
                      setOccasionType(o.key)
                    }
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {isCustomOccasion && (
              <input
                type="text"
                className="custom-rel-input"
                placeholder="Type your occasion (e.g. Farewell, Retirement, Get Well Soon)"
                value={customOccasion}
                onChange={e => { setCustomOccasion(e.target.value); setOccasionType(e.target.value) }}
                autoFocus
              />
            )}
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
            <label>✍️ Message</label>
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
                placeholder="Write your heartfelt message here..."
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                rows={4}
              />
            )}
            {messageType === 'ai' && (
              <div className="ai-note">
                ✨ AI will generate a personalised message based on the occasion, names & relationship using <b>Groq (Llama3)</b>!
              </div>
            )}
          </div>

          {/* Character Selection */}
          <div className="field">
            <label>🎭 Choose Character <span>(5th slide-ல வரும்)</span></label>
            <div className="char-grid">
              {CHARACTERS.map(ch => (
                <button
                  key={ch.key}
                  type="button"
                  className={`char-btn${selectedCharacter === ch.key ? ' active' : ''}`}
                  onClick={() => setSelectedCharacter(ch.key)}
                >
                  <img src={ch.src} alt={ch.label} />
                  <span>{ch.label}</span>
                </button>
              ))}
            </div>
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
              : '🎉 Create Celebration Card'}
          </button>

        </form>
      </div>
    </div>
  )
}