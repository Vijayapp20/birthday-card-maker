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

// One simple flat-color SVG icon per occasion — this is the shape that
// "pops up" out of the card when it opens.
const POPUP_ICONS = {
  birthday: (
    <svg viewBox="0 0 64 64"><path d="M14 30h36v20a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V30z" fill="#c9436f"/><path d="M14 30h36v8H14z" fill="#f5cf6b"/><rect x="10" y="24" width="44" height="8" rx="2" fill="#e8567d"/><path d="M22 24v-6c0-3 3-4 3-7s-2-4-2-4" fill="none" stroke="#8a5a2f" strokeWidth="2" strokeLinecap="round"/><path d="M32 24v-8c0-3 3-4 3-7s-2-4-2-4" fill="none" stroke="#8a5a2f" strokeWidth="2" strokeLinecap="round"/><path d="M42 24v-6c0-3 3-4 3-7s-2-4-2-4" fill="none" stroke="#8a5a2f" strokeWidth="2" strokeLinecap="round"/><circle cx="25" cy="7" r="2.4" fill="#ffb347"/><circle cx="35" cy="5" r="2.4" fill="#ffb347"/><circle cx="45" cy="7" r="2.4" fill="#ffb347"/></svg>
  ),
  anniversary: (
    <svg viewBox="0 0 64 64"><circle cx="24" cy="34" r="14" fill="none" stroke="#d4af37" strokeWidth="4"/><circle cx="40" cy="34" r="14" fill="none" stroke="#c9436f" strokeWidth="4"/><path d="M32 12c-6 6-6 14 0 20 6-6 6-14 0-20z" fill="#e8567d"/></svg>
  ),
  graduation: (
    <svg viewBox="0 0 64 64"><path d="M32 14 4 26l28 12 28-12z" fill="#3a3a96"/><path d="M16 30v12c0 4 7 8 16 8s16-4 16-8V30" fill="none" stroke="#3a3a96" strokeWidth="3"/><line x1="56" y1="26" x2="56" y2="42" stroke="#8a5a2f" strokeWidth="2"/><circle cx="56" cy="44" r="2.4" fill="#8a5a2f"/></svg>
  ),
  newjob: (
    <svg viewBox="0 0 64 64"><rect x="10" y="24" width="44" height="28" rx="4" fill="#149aa0"/><rect x="24" y="14" width="16" height="10" rx="2" fill="none" stroke="#0a4448" strokeWidth="3"/><rect x="10" y="34" width="44" height="6" fill="#0d5b60"/></svg>
  ),
  newhome: (
    <svg viewBox="0 0 64 64"><path d="M32 10 8 30v24h48V30z" fill="#d97b2a"/><rect x="27" y="38" width="10" height="16" fill="#fffaf0"/><rect x="14" y="34" width="8" height="8" fill="#fffaf0"/><rect x="42" y="34" width="8" height="8" fill="#fffaf0"/></svg>
  ),
  babyshower: (
    <svg viewBox="0 0 64 64"><path d="M26 14h12v10c4 3 6 8 6 13 0 9-8 15-12 15s-12-6-12-15c0-5 2-10 6-13z" fill="#8ea9ff"/><rect x="26" y="10" width="12" height="6" rx="2" fill="#bcd4ff"/></svg>
  ),
  engagement: (
    <svg viewBox="0 0 64 64"><path d="M32 12 20 26h24z" fill="#f0d2a0"/><path d="M20 26 32 54 44 26z" fill="#d4af37"/></svg>
  ),
}
const DEFAULT_POPUP_ICON = (
  <svg viewBox="0 0 64 64"><path d="M32 54s-20-12-20-26a12 12 0 0 1 20-8 12 12 0 0 1 20 8c0 14-20 26-20 26z" fill="#c9436f"/></svg>
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
  const coverRef = useRef(null)
  const riserRef = useRef(null)

  const popupIcon = POPUP_ICONS[occasionType] || DEFAULT_POPUP_ICON

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

    // Pop-up book mechanic: the cover swings open on its left edge (a
    // hinge, via rotateY) while the occasion icon rises up from flat
    // against the spread to standing upright, timed to peak right as the
    // cover finishes opening — same illusion a real pop-up card uses.
    const tl = gsap.timeline({
      onComplete: () => {
        setStage('opening')
        setTimeout(() => setStage('writing'), 500)
      },
    })
    tl.to(coverRef.current, { rotateY: -158, duration: 0.9, ease: 'power3.inOut' })
      .to(riserRef.current, { rotateX: 0, scaleY: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.55')
      .to(coverRef.current, { opacity: 0, duration: 0.2 }, '-=0.1')
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
              className="pop-wrap"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.25 } }}
            >
              <div className="lc-envelope-glow" />
              <div className="pop-card">
                <div className="pop-spread">
                  <div className="pop-riser" ref={riserRef}>{popupIcon}</div>
                </div>
                <div
                  className="pop-cover"
                  ref={coverRef}
                  onClick={handleOpen}
                  style={{ transformOrigin: 'left center' }}
                >
                  <span className="pop-cover-icon">{popupIcon}</span>
                  <p className="pop-title">{occ.cardTitle}</p>
                  {stage === 'envelope' && (
                    <p className="gl-tap-hint">Tap to open your card, {recipientName} 💫</p>
                  )}
                </div>
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
