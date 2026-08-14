import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import confetti from 'canvas-confetti'
import TypeIt from 'typeit'
import Swal from 'sweetalert2'
import { getOccasionConfig } from '../utils/occasions'
import VantaCloudsBackground from './VantaCloudsBackground'
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
  // A second, sparser burst of metallic gold stars for a premium/luxe finish
  confetti({
    particleCount: 22,
    spread: 100,
    startVelocity: 32,
    origin: { y: 0.55 },
    colors: ['#d4af37', '#f5cf6b', '#fff2c2'],
    shapes: ['star'],
    scalar: 1,
    ticks: 220,
  })
}

// Subtle SVG fractal-noise texture, applied as a low-opacity multiply
// overlay so the paper reads as fibrous/textured rather than a flat fill.
const PAPER_NOISE_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"

const flapSpring   = { type: 'spring', stiffness: 110, damping: 14 }
const paperSpring  = { type: 'spring', stiffness: 130, damping: 16 }

// Small gold corner-flourish ornament, reused in all 4 corners of the paper
const CORNER_FLOURISH = (
  <svg viewBox="0 0 40 40" width="26" height="26">
    <path
      d="M2 2 C 2 14, 8 20, 20 20 M2 2 C 14 2, 20 8, 20 20 M2 8 C 2 8, 6 8, 6 4 M8 2 C 8 2, 8 6, 4 6"
      fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"
    />
    <circle cx="20" cy="20" r="1.6" fill="currentColor" />
  </svg>
)

export default function LetterCard({ cardData, onBack }) {
  const { recipientName, senderName, message, relationship, occasionType, shareId } = cardData
  const occ = getOccasionConfig(occasionType || 'birthday')

  // stage: envelope -> opening -> writing -> done
  const [stage, setStage] = useState('envelope')
  const [sparkles, setSparkles] = useState([])
  const [copied, setCopied] = useState(false)

  const [bodyEl, setBodyEl] = useState(null) // callback ref target — see the effect below
  const sparkleTimerRef = useRef(null)
  const sparkleIdRef = useRef(0)
  const typeItRef = useRef(null)
  const sealRef = useRef(null)
  const sealLeftRef = useRef(null)
  const sealRightRef = useRef(null)

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

    // Wax-seal crack: a quick press-and-shake, then the seal splits in two
    // and flies apart — a small choreographed moment before the envelope
    // itself opens, instead of the seal just fading out flatly.
    const tl = gsap.timeline({
      onComplete: () => {
        setStage('opening')
        setTimeout(() => setStage('writing'), 1450)
      },
    })
    tl.to(sealRef.current, { scale: 1.12, rotate: -4, duration: 0.12, ease: 'power2.out' })
      .to(sealRef.current, { scale: 0.95, rotate: 3, duration: 0.1, ease: 'power2.inOut' })
      .to(sealRef.current, { opacity: 0, duration: 0.06 }, '<')
      .set([sealLeftRef.current, sealRightRef.current], { opacity: 1 }, '<')
      .to(sealLeftRef.current,  { x: -16, y: 7, rotate: -38, opacity: 0, duration: 0.45, ease: 'power2.in' }, '<')
      .to(sealRightRef.current, { x: 16,  y: 7, rotate: 38,  opacity: 0, duration: 0.45, ease: 'power2.in' }, '<')
  }, [stage])

  useEffect(() => {
    // Depends on bodyEl (a real DOM node via callback ref), not a timing
    // assumption — this guarantees TypeIt only starts once the <p> has
    // actually mounted, regardless of how AnimatePresence's exit/enter
    // timing plays out on a given device. Fixes a bug where TypeIt could
    // silently never start on slower devices because the effect fired
    // before the paper had finished mounting.
    if (stage !== 'writing' || !bodyEl) return

    const safeMessage = (message || '').replace(/\n/g, '<br />')
    const html =
      `<span class="lc-greeting">Dear ${recipientName},</span><br /><br />` +
      safeMessage +
      `<br /><br /><span class="lc-closing">With Love,</span><br />` +
      `<span class="lc-sign">${senderName}</span>`

    typeItRef.current = new TypeIt(bodyEl, {
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
  }, [stage, bodyEl, message, recipientName, senderName])

  useEffect(() => () => clearInterval(sparkleTimerRef.current), [])

  return (
    <div className="lc-root">
      <div className="lc-bg" />
      <VantaCloudsBackground skyColor={0xfff0e0} cloudColor={0xffd9c2} speed={0.85} />

      {sparkles.map(s => (
        <div key={s.id} className="lc-sparkle" style={{ left: `${s.left}vw`, animationDuration: `${s.duration}s` }}>
          {s.kind}
        </div>
      ))}

      <div className="lc-stage">
        <AnimatePresence mode="wait">
          {(stage === 'envelope' || stage === 'opening') && (
            <motion.div
              key="envelope"
              className="lc-envelope"
              onClick={handleOpen}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.3 } }}
            >
              <div className="lc-envelope-glow" />
              <div className="lc-envelope-shadow" />
              <div className="lc-envelope-back" />
              <div className="lc-stamp"><div className="lc-stamp-icon">🎉</div></div>
              <div className={`lc-envelope-letter-peek${stage === 'opening' ? ' open' : ''}`} />

              {/* Spring-driven flap — real paper doesn't ease linearly, it swings and settles */}
              <motion.div
                className="lc-envelope-flap"
                style={{ transformOrigin: 'top center' }}
                animate={{ rotateX: stage === 'opening' ? 175 : 0 }}
                transition={flapSpring}
              />

              <div className="lc-envelope-front-left" />
              <div className="lc-envelope-front-right" />

              {/* Wax seal — an intact circle plus two pre-split halves (see
                  handleOpen's GSAP timeline) used for the crack moment */}
              <div className="lc-seal" ref={sealRef}>
                <span className="lc-seal-shine" />
                <svg viewBox="0 0 24 24" className="lc-seal-icon">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <div className="lc-seal-half lc-seal-half--left" ref={sealLeftRef} />
              <div className="lc-seal-half lc-seal-half--right" ref={sealRightRef} />

              {stage === 'envelope' && (
                <p className="lc-tap-hint">Tap to open your letter, {recipientName} 💫</p>
              )}
            </motion.div>
          )}

          {(stage === 'writing' || stage === 'done') && (
            <motion.div
              key="paper"
              className={`lc-paper${stage === 'done' ? ' glow' : ''}`}
              initial={{ opacity: 0, scaleY: 0.32, y: 26, rotate: -2.2 }}
              animate={{ opacity: 1, scaleY: 1, y: 0, rotate: -0.6 }}
              transition={paperSpring}
            >
              <div className="lc-paper-noise" style={{ backgroundImage: `url("${PAPER_NOISE_URL}")` }} />
              <div className="lc-paper-fold-lines" />
              <div className="lc-paper-inner">
                <span className="lc-corner lc-corner--tl">{CORNER_FLOURISH}</span>
                <span className="lc-corner lc-corner--tr">{CORNER_FLOURISH}</span>
                <span className="lc-corner lc-corner--bl">{CORNER_FLOURISH}</span>
                <span className="lc-corner lc-corner--br">{CORNER_FLOURISH}</span>
                <p className="lc-title" data-text={occ.cardTitle}>{occ.cardTitle}</p>
                {relationship && <p className="lc-subtitle">for my dear {relationship.toLowerCase()}</p>}
                <p className={`lc-body${stage === 'writing' ? ' writing' : ''}`} ref={setBodyEl} />
              </div>
              <div className="lc-paper-curl" />
            </motion.div>
          )}
        </AnimatePresence>
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
