import { useState, useEffect, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import TypeIt from 'typeit'
import Swal from 'sweetalert2'
import { getOccasionConfig } from '../utils/occasions'
import './LetterCard.css'

function fireSoftConfetti() {
  confetti({
    particleCount: 60,
    spread: 70,
    startVelocity: 28,
    origin: { y: 0.6 },
    colors: ['#f3d9b1', '#ff9fb8', '#ffe3ec', '#c9436f'],
    scalar: 0.8,
  })
}

export default function LetterCard({ cardData, onBack }) {
  const { recipientName, senderName, message, relationship, occasionType, shareId } = cardData
  const occ = getOccasionConfig(occasionType || 'birthday')

  // stage: envelope -> opening -> writing -> done
  const [stage, setStage] = useState('envelope')
  const [sparkles, setSparkles] = useState([])
  const [copied, setCopied] = useState(false)

  const letterBodyRef = useRef(null)
  const sparkleTimerRef = useRef(null)
  const sparkleIdRef = useRef(0)
  const typeItRef = useRef(null)

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
      Swal.fire({ title: 'Could not copy link', text: shareUrl, icon: 'info' })
    }
  }, [shareUrl])

  const handleOpen = useCallback(() => {
    if (stage !== 'envelope') return
    setStage('opening')
    // Flap opens (~700ms) then letter slides + unfolds (~900ms) then writing begins
    setTimeout(() => setStage('writing'), 1600)
  }, [stage])

  useEffect(() => {
    if (stage !== 'writing' || !letterBodyRef.current) return

    const safeMessage = (message || '').replace(/\n/g, '<br />')
    const html =
      `<span class="lc-greeting">Dear ${recipientName},</span><br /><br />` +
      safeMessage +
      `<br /><br /><span class="lc-closing">With Love,</span><br />` +
      `<span class="lc-sign">${senderName}</span>`

    typeItRef.current = new TypeIt(letterBodyRef.current, {
      strings: [html],
      startDelay: 300,
      speed: 28,
      cursor: true,
      html: true,
      afterComplete: () => {
        setStage('done')
        fireSoftConfetti()
        sparkleTimerRef.current = setInterval(() => {
          const id = sparkleIdRef.current++
          const left = Math.random() * 100
          const duration = Math.random() * 2.5 + 3
          const kind = Math.random() > 0.5 ? '💖' : '✨'
          setSparkles(prev => [...prev, { id, left, duration, kind }])
          setTimeout(() => setSparkles(prev => prev.filter(s => s.id !== id)), (duration + 0.5) * 1000)
        }, 400)
      },
    }).go()

    return () => {
      typeItRef.current?.destroy?.()
      clearInterval(sparkleTimerRef.current)
    }
  }, [stage, message, recipientName, senderName])

  useEffect(() => () => clearInterval(sparkleTimerRef.current), [])

  return (
    <div className="lc-root">
      <div className="lc-bg" />

      {sparkles.map(s => (
        <div key={s.id} className="lc-sparkle" style={{ left: `${s.left}vw`, animationDuration: `${s.duration}s` }}>
          {s.kind}
        </div>
      ))}

      <div className="lc-stage">
        {(stage === 'envelope' || stage === 'opening') && (
          <div className={`lc-envelope${stage === 'opening' ? ' open' : ''}`} onClick={handleOpen}>
            <div className="lc-envelope-shadow" />
            <div className="lc-envelope-back" />
            <div className="lc-stamp">
              <div className="lc-stamp-icon">🎉</div>
            </div>
            <div className="lc-envelope-letter-peek" />
            <div className="lc-envelope-flap" />
            <div className="lc-envelope-front-left" />
            <div className="lc-envelope-front-right" />
            <div className="lc-seal">
              <span className="lc-seal-shine" />
              <svg viewBox="0 0 24 24" className="lc-seal-icon">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            {stage === 'envelope' && (
              <p className="lc-tap-hint">Tap to open your letter, {recipientName} 💫</p>
            )}
          </div>
        )}

        {(stage === 'writing' || stage === 'done') && (
          <div className={`lc-paper${stage === 'done' ? ' settled glow' : ''}`}>
            <div className="lc-paper-inner">
              <p className="lc-title">{occ.cardTitle}</p>
              {relationship && <p className="lc-subtitle">for my dear {relationship.toLowerCase()}</p>}
              <p className={`lc-body${stage === 'writing' ? ' writing' : ''}`} ref={letterBodyRef} />
            </div>
          </div>
        )}
      </div>

      {onBack && (
        <button className="lc-back" onClick={onBack} title="Go back">← Back</button>
      )}

      {shareUrl && (
        <button className="lc-share" onClick={handleCopyLink} title="Copy shareable link">
          {copied ? '✅ Copied!' : '🔗 Share'}
        </button>
      )}

      <div className="lc-footer">
        <b>made with ❤️ by <span>@vijayprasanth</span></b>
      </div>
    </div>
  )
}
