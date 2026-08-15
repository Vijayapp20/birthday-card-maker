import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import confetti from 'canvas-confetti'
import Swal from 'sweetalert2'
import { getOccasionConfig } from '../utils/occasions'
import VantaCloudsBackground from './VantaCloudsBackground'
import HandwritingText from './HandwritingText'
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

  const [bodyWidth, setBodyWidth] = useState(0)
  const sparkleTimerRef = useRef(null)
  const sparkleIdRef = useRef(0)
  const glassCoverRef = useRef(null)

  const bodyWrapRef = useCallback(node => {
    if (node) setBodyWidth(node.clientWidth)
  }, [])

  const blocks = useMemo(() => {
    const out = [
      { text: `Dear ${recipientName},`, size: 'greeting' },
      { break: true },
    ]
    ;(message || '').split('\n').forEach(paragraph => out.push({ text: paragraph, size: 'body' }))
    out.push({ break: true })
    out.push({ text: 'With Love,', size: 'closing' })
    out.push({ text: senderName, size: 'sign' })
    return out
  }, [recipientName, message, senderName])

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

    // Single-fold hinge-open: the glass cover swings up and back on its
    // top edge (like a book cover or a laptop lid), fading out over the
    // back half of the motion, revealing the letter underneath — the
    // "Apple Mail" style open instead of a flat fade/slide.
    gsap.to(glassCoverRef.current, {
      rotateX: -112,
      y: -14,
      duration: 0.85,
      ease: 'power3.inOut',
      onUpdate: function () {
        if (this.progress() > 0.55) {
          gsap.set(glassCoverRef.current, { opacity: 1 - (this.progress() - 0.55) / 0.45 })
        }
      },
      onComplete: () => {
        setStage('opening')
        setTimeout(() => setStage('writing'), 500)
      },
    })
  }, [stage])

  const handleWritingComplete = useCallback(() => {
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
  }, [])

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
              className="gl-wrap"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.25 } }}
            >
              <div className="lc-envelope-glow" />
              <div
                className="gl-cover"
                ref={glassCoverRef}
                onClick={handleOpen}
                style={{ transformOrigin: 'top center' }}
              >
                <span className="gl-cover-sheen" />
                <div className="gl-orb">
                  <svg viewBox="0 0 24 24" className="gl-orb-icon">
                    <path d="M2 6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17.5v-11z" fill="none" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M3.5 6.5l8 6.2a1.4 1.4 0 0 0 1.7 0l8-6.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {stage === 'envelope' && (
                  <p className="gl-tap-hint">Tap to open your letter, {recipientName} 💫</p>
                )}
              </div>
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
                <div className="lc-body" ref={bodyWrapRef}>
                  {bodyWidth > 0 && (
                    <HandwritingText
                      blocks={blocks}
                      width={bodyWidth}
                      active={stage === 'writing'}
                      onComplete={handleWritingComplete}
                    />
                  )}
                </div>
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
