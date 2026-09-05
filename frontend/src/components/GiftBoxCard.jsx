import { useState, useRef, useCallback, useEffect } from 'react'
import confetti from 'canvas-confetti'
import TypeIt from 'typeit'
import api from '../api'
import { getOccasionConfig } from '../utils/occasions'
import { playOccasionChime, startAmbientPad } from '../utils/giftSound'
import AmbientParticles from './AmbientParticles'
import './GiftBoxCard.css'

function fireBurst(originY = 0.55) {
  const defaults = { startVelocity: 35, spread: 100, ticks: 80, zIndex: 5, origin: { y: originY } }
  confetti({ ...defaults, particleCount: 60, angle: 60, origin: { x: 0, y: originY } })
  confetti({ ...defaults, particleCount: 60, angle: 120, origin: { x: 1, y: originY } })
  confetti({ ...defaults, particleCount: 50, origin: { x: 0.5, y: originY } })
}

// Interactive gift-box reveal template. Pure CSS box + lid/ribbon animation —
// no extra animation library needed. Tap opens the box, confetti bursts, then
// the message and (optional) photo fade in.
export default function GiftBoxCard({ cardData, onBack }) {
  const { recipientName, senderName, message, photoUrl, shareId, occasionType, relationship } = cardData
  const occ = getOccasionConfig(occasionType || 'birthday')

  const [stage, setStage]     = useState('closed') // closed -> opening -> open
  const [isTyping, setIsTyping] = useState(false)
  const [copied, setCopied]   = useState(false)
  const [muted, setMuted]     = useState(() => localStorage.getItem('gb-sound-muted') === '1')
  const [poem, setPoem]           = useState(null)
  const [poemLoading, setPoemLoading] = useState(false)
  const [poemError, setPoemError]     = useState('')
  const [isSpeaking, setIsSpeaking]   = useState(false)
  const [poemLang, setPoemLang]       = useState('en')
  const stopAmbientRef = useRef(null)

  const toggleMuted = useCallback(() => {
    setMuted(prev => {
      const next = !prev
      localStorage.setItem('gb-sound-muted', next ? '1' : '0')
      return next
    })
  }, [])

  const kalimatRef = useRef(null)
  const boxRef      = useRef(null)

  const shareUrl = shareId
    ? `${window.location.origin}${window.location.pathname}?card=${shareId}`
    : null

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked — silently ignore, the link is still shown via the button title
    }
  }, [shareUrl])

  // Bonus reveal — a short AI-generated poem, fetched on demand so it
  // never blocks or delays the main card reveal.
  const handleGeneratePoem = useCallback(async (lang) => {
    if (poemLoading || poem) return
    setPoemLang(lang)
    setPoemLoading(true)
    setPoemError('')
    try {
      const res = await api.post('/api/generate-poem', {
        recipientName, senderName, relationship, occasionType, language: lang,
      })
      setPoem(res.data.poem)
    } catch {
      setPoemError("Couldn't write a poem right now — try again in a bit.")
    } finally {
      setPoemLoading(false)
    }
  }, [poemLoading, poem, recipientName, senderName, relationship, occasionType])

  // Reads the poem aloud using the browser's built-in speech synthesis,
  // with a soft synthesized background pad playing underneath — no audio
  // files, no library, works fully offline once loaded.
  const handlePlayPoem = useCallback(() => {
    if (!('speechSynthesis' in window) || !poem) return
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      stopAmbientRef.current?.()
      setIsSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(poem.replace(/\n/g, '. '))
    utterance.lang = poemLang === 'ta' ? 'ta-IN' : 'en-US'
    utterance.rate = 0.9
    utterance.pitch = 1.05
    utterance.onend = () => {
      stopAmbientRef.current?.()
      setIsSpeaking(false)
    }
    utterance.onerror = () => {
      stopAmbientRef.current?.()
      setIsSpeaking(false)
    }
    window.speechSynthesis.cancel() // stop anything already queued
    stopAmbientRef.current = startAmbientPad(occasionType)
    window.speechSynthesis.speak(utterance)
    setIsSpeaking(true)
  }, [poem, poemLang, isSpeaking, occasionType])

  // Stop any speech/ambient pad in progress if the card unmounts (e.g. user hits Back).
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      stopAmbientRef.current?.()
    }
  }, [])

  const handleOpen = useCallback(() => {
    if (stage !== 'closed') return
    setStage('opening')
    if (!muted) playOccasionChime(occasionType)

    // Small burst right as the lid pops, bigger burst once it's fully open
    setTimeout(() => {
      const rect = boxRef.current?.getBoundingClientRect()
      const originY = rect ? rect.top / window.innerHeight : 0.55
      fireBurst(originY)
    }, 250)

    setTimeout(() => setStage('open'), 900)
  }, [stage, muted, occasionType])

  useEffect(() => {
    if (stage !== 'open' || !kalimatRef.current) return
    setIsTyping(true)
    const safeMessage = message.replace(/\n/g, '<br />')
    const fullHtml = safeMessage + `<br /><br /><span class="gb-from">— From ${senderName} ✨</span>`
    const instance = new TypeIt(kalimatRef.current, {
      strings: [fullHtml], startDelay: 150, speed: 28, cursor: true, html: true,
      afterComplete() { setIsTyping(false) },
    }).go()
    return () => instance.destroy()
  }, [stage, message, senderName])

  return (
    <div className="gb-root" style={{ '--gb-accent': occ.particleColor }}>
      <div className="gb-bg-wrap">
        <div className="gb-overlay" />
        <AmbientParticles color={occ.particleColor} />
      </div>

      <div className="gb-stage">
        {stage !== 'open' && (
          <>
            <p className="gb-hint">
              {stage === 'closed' ? `A surprise for you, ${recipientName}! 🎁` : 'Opening…'}
            </p>
            <div
              ref={boxRef}
              className={`gb-box${stage === 'opening' ? ' gb-box--opening' : ''}`}
              data-shape={occ.giftBoxShape || 'classic'}
              onClick={handleOpen}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOpen()}
            >
              <div className="gb-lid">
                {occ.giftBoxShape === 'heart' && <div className="gb-heart-shape" />}
                {occ.giftBoxShape !== 'heart' && occ.giftBoxShape !== 'dome' && <div className="gb-bow" />}
              </div>
              <div className="gb-body">
                <div className="gb-ribbon-v" />
              </div>
              <div className="gb-ribbon-h gb-ribbon-h--left" />
              <div className="gb-ribbon-h gb-ribbon-h--right" />
              <div className="gb-glow" />
            </div>
            {stage === 'closed' && <p className="gb-tap-label">Tap the box to open</p>}
          </>
        )}

        {stage === 'open' && (
          <div className="gb-reveal">
            {photoUrl && (
              <div className="gb-photo">
                <img src={photoUrl} alt={recipientName} />
              </div>
            )}
            <p className="gb-title">{occ.cardTitle}</p>
            <p className={`gb-message${isTyping ? ' gb-message--typing' : ''}`} ref={kalimatRef} />

            {!isTyping && (
              <div className="gb-poem-zone">
                {!poem && !poemLoading && (
                  <div className="gb-poem-lang-choice">
                    <p className="gb-poem-prompt">✨ Want a little poem too?</p>
                    <div className="gb-poem-lang-btns">
                      <button type="button" className="gb-poem-btn" onClick={() => handleGeneratePoem('en')}>
                        English
                      </button>
                      <button type="button" className="gb-poem-btn" onClick={() => handleGeneratePoem('ta')}>
                        தமிழ்
                      </button>
                    </div>
                  </div>
                )}
                {poemLoading && <p className="gb-poem-loading">Writing a little poem…</p>}
                {poemError && <p className="gb-poem-error">{poemError}</p>}
                {poem && (
                  <>
                    <p className="gb-poem">
                      {poem.split('\n').filter(Boolean).map((line, i) => (
                        <span key={i}>{line}<br /></span>
                      ))}
                    </p>
                    {'speechSynthesis' in window && (
                      <button type="button" className="gb-poem-play-btn" onClick={handlePlayPoem}>
                        {isSpeaking
                          ? (poemLang === 'ta' ? '⏹ நிறுத்து' : '⏹ Stop')
                          : (poemLang === 'ta' ? '🔊 கேட்க' : '🔊 Play poem')}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {onBack && (
        <button className="gb-back-toggle" onClick={onBack} title="Go back">← Back</button>
      )}

      <button className="gb-mute-toggle" onClick={toggleMuted} title={muted ? 'Unmute chime' : 'Mute chime'}>
        {muted ? '🔇' : '🔊'}
      </button>

      {shareUrl && (
        <button className="gb-share-toggle" onClick={handleCopyLink} title="Copy shareable link">
          {copied ? '✅ Copied!' : '🔗 Share'}
        </button>
      )}

      <div className="gb-footer">
        <b>made with ❤️ by <span>@vijayprasanth</span></b>
      </div>
    </div>
  )
}
