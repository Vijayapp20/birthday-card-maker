import { useState, useEffect, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import Swal from 'sweetalert2'
import TypeIt from 'typeit'
import './BirthdayCard.css'

// Asset imports
import pandaputih from '../assets/pandaputih.gif'
import cilukba    from '../assets/cilukba.gif'
import weee       from '../assets/weee.gif'
import ngumpet    from '../assets/ngumpet.gif'
import pusn       from '../assets/pusn.gif'
import mikir      from '../assets/mikir.gif'
import g5         from '../assets/g5.gif'
import mndkat     from '../assets/mndkat.gif'
import pandapanah from '../assets/pandapanah.gif'
import wp2        from '../assets/wp2.jpeg'

// Map character key to imported gif asset
const GIF_MAP = { pusn, mikir, cilukba, g5, mndkat, pandaputih, pandapanah }

// Occasion-based content config
const OCCASION_CONFIG = {
  birthday:    { cardTitle: 'Happy Level Up Day! 🥳',       slide1: 'Hey {name} 🤭❤️',  slide3: "It's your special day! 🎂",       slide5: 'Wishing you a long life\nand good health always 🥰' },
  anniversary: { cardTitle: 'Happy Anniversary! 💍',         slide1: 'Hey {name} 💕',    slide3: 'Celebrating your love! 💍',        slide5: 'Wishing you endless love\nand happiness together 🥰' },
  graduation:  { cardTitle: 'Congratulations! 🎓',           slide1: 'Hey {name} 🎉',    slide3: 'You did it! 🎓',                   slide5: 'Wishing you great success\nin all your future endeavors! 🚀' },
  newjob:      { cardTitle: 'Congrats on the New Role! 🚀',  slide1: 'Hey {name} 💼',    slide3: 'A new chapter begins! 💼',         slide5: 'Wishing you tremendous success\nin your new journey! ⭐' },
  newhome:     { cardTitle: 'Welcome to Your New Home! 🏠',  slide1: 'Hey {name} 🏠',    slide3: 'A new place to call home! 🏠',     slide5: 'Wishing you warmth and joy\nin your beautiful new home 🌟' },
  babyshower:  { cardTitle: 'Welcome Little One! 👶',        slide1: 'Hey {name} 🍼',    slide3: 'A new blessing arrives! 👶',       slide5: 'Wishing your family\njoy and love always 💕' },
  engagement:  { cardTitle: 'Congratulations! 💑',           slide1: 'Hey {name} 💑',    slide3: 'A beautiful journey begins! 💑',   slide5: 'Wishing you a lifetime\nof love and happiness together 💕' },
}

function getOccasionConfig(type) {
  if (OCCASION_CONFIG[type]) return OCCASION_CONFIG[type]
  const label = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Special Moment'
  return {
    cardTitle: 'Congratulations! 🎉',
    slide1: 'Hey {name} 🎉',
    slide3: `Celebrating your ${label}! 🎊`,
    slide5: 'Wishing you all the best\nin this special moment 🥰',
  }
}

// Celebration melody using Web Audio API
const HBD_NOTES = [
  [392, 0.4], [392, 0.2], [440, 0.6], [392, 0.6], [523.25, 0.6], [493.88, 1.2],
  [392, 0.4], [392, 0.2], [440, 0.6], [392, 0.6], [587.33, 0.6], [523.25, 1.2],
  [392, 0.4], [392, 0.2], [783.99, 0.6], [659.25, 0.6], [523.25, 0.6], [493.88, 0.6], [440, 1.2],
  [698.46, 0.4], [698.46, 0.2], [659.25, 0.6], [523.25, 0.6], [587.33, 0.6], [523.25, 1.4],
]

function playTune(ctx, onDone) {
  let t = ctx.currentTime + 0.05
  HBD_NOTES.forEach(([freq, dur]) => {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.linearRampToValueAtTime(0.18, t + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur)
    t += dur
  })
  const total = HBD_NOTES.reduce((s, [, d]) => s + d, 0)
  return setTimeout(onDone, total * 1000 + 300)
}

function fireConfetti() {
  const duration = 3000
  const end = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }
  const rnd = (min, max) => Math.random() * (max - min) + min
  const interval = setInterval(() => {
    const timeLeft = end - Date.now()
    if (timeLeft <= 0) return clearInterval(interval)
    const pc = 50 * (timeLeft / duration)
    confetti({ ...defaults, particleCount: pc, origin: { x: rnd(0.1, 0.3), y: Math.random() - 0.2 } })
    confetti({ ...defaults, particleCount: pc, origin: { x: rnd(0.7, 0.9), y: Math.random() - 0.2 } })
  }, 250)
}

export default function BirthdayCard({ cardData, onBack }) {
  const { recipientName, senderName, message, photoUrl, shareId, characterGif, occasionType } = cardData

  const chosenGif = GIF_MAP[characterGif] || g5
  const occ = getOccasionConfig(occasionType || 'birthday')

  const SLIDES = [
    { img: pusn,      text: occ.slide1.replace('{name}', recipientName), fancy: false },
    { img: mikir,     text: 'I Just Want To\nShare Something 😊',         fancy: false },
    { img: cilukba,   text: occ.slide3,                                   fancy: false },
    { img: chosenGif, text: `${occ.cardTitle}\n${recipientName}!`,        fancy: true  },
    { img: mndkat,    text: occ.slide5,                                   fancy: false },
  ]

  const [stage,       setStage]       = useState('intro')
  const [isTyping,    setIsTyping]    = useState(false)
  const [slideIndex,  setSlideIndex]  = useState(0)
  const [btnLabel,    setBtnLabel]    = useState('Swipe 👉')
  const [btnVisible,  setBtnVisible]  = useState(false)
  const [sliderReady, setSliderReady] = useState(false)
  const [wallZoom,    setWallZoom]    = useState(false)
  const [hearts,      setHearts]      = useState([])
  const [musicOn,     setMusicOn]     = useState(false)
  const [copied,      setCopied]      = useState(false)

  const audioCtxRef   = useRef(null)
  const musicTimerRef = useRef(null)
  const kalimatRef    = useRef(null)
  const heartTimerRef = useRef(null)
  const heartIdRef    = useRef(0)
  const busyRef       = useRef(false)

  const bgImage = wp2

  const toggleMusic = useCallback(() => {
    if (musicOn) {
      clearTimeout(musicTimerRef.current)
      if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
      setMusicOn(false)
      return
    }
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    audioCtxRef.current = ctx
    setMusicOn(true)
    const loop = () => { if (!audioCtxRef.current) return; musicTimerRef.current = playTune(ctx, loop) }
    loop()
  }, [musicOn])

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

  const handleHeartClick = useCallback(() => {
    fireConfetti()
    setTimeout(() => { setStage('slider'); setSliderReady(true); setBtnVisible(true) }, 500)
  }, [])

  const handleSwipe = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    if (slideIndex === SLIDES.length - 1) { await showGiftPopup(); busyRef.current = false; return }
    const next = slideIndex + 1
    setBtnVisible(false)
    setTimeout(() => {
      setSlideIndex(next)
      if (next === SLIDES.length - 1) setBtnLabel('💌 Open Gift')
      setBtnVisible(true)
      busyRef.current = false
    }, 500)
  }, [slideIndex])

  async function showGiftPopup() {
    const swals  = Swal.mixin({ allowOutsideClick: false, showConfirmButton: true })
    const swalst = Swal.mixin({ timer: 2600, allowOutsideClick: false, showConfirmButton: false, timerProgressBar: true })
    const { isConfirmed } = await swals.fire({
      title: 'Do you want a gift? 🤭❤️', imageUrl: pandaputih, imageWidth: 100, imageHeight: 100,
      showCancelButton: true, confirmButtonText: 'Yes', cancelButtonText: 'No', cancelButtonColor: '#555',
    })
    let poinjwb = 1
    if (isConfirmed) {
      await swalst.fire({ title: 'Just kidding! 🤣', html: 'No gift for you 😜❤️', imageUrl: weee, imageWidth: 100, imageHeight: 100 })
    } else {
      await swals.fire({ title: 'Oh no!', html: "Alright, if you don't want it 😜❤️", imageUrl: ngumpet, imageWidth: 100, imageHeight: 100 })
      poinjwb = 2
    }
    showFinal(poinjwb)
  }

  function showFinal(poinjwb) {
    setStage('final')
    setWallZoom(true)
    setTimeout(() => {
      if (!kalimatRef.current) return
      const jokePrefix = poinjwb === 1
        ? '<b>Just kidding haha 🤣</b><br /><br />'
        : 'Just Kidding 🤣<br /><br />'
      const safeMessage = message.replace(/\n/g, '<br />')
      const fullHtml = jokePrefix + safeMessage + `<br /><br /><span class="ft">— From ${senderName} ✨</span>`
      setIsTyping(true)
      let scrolling = true
      const smoothFollowScroll = () => {
        if (!scrolling || !kalimatRef.current) return
        const rect = kalimatRef.current.getBoundingClientRect()
        const targetY = window.scrollY + rect.bottom - window.innerHeight / 2
        const current = window.scrollY
        const next = current + (targetY - current) * 0.08
        if (Math.abs(targetY - current) > 1) window.scrollTo(0, next)
        requestAnimationFrame(smoothFollowScroll)
      }
      requestAnimationFrame(smoothFollowScroll)
      new TypeIt(kalimatRef.current, {
        strings: [fullHtml], startDelay: 50, speed: 30, cursor: true, html: true,
        afterComplete() {
          scrolling = false
          setIsTyping(false)
          if (kalimatRef.current) kalimatRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
          heartTimerRef.current = setInterval(() => {
            const id = heartIdRef.current++
            const left = Math.random() * 95
            const duration = Math.random() * 3 + 3
            setHearts(prev => [...prev, { id, left, duration }])
            setTimeout(() => setHearts(prev => prev.filter(h => h.id !== id)), (duration + 0.5) * 1000)
          }, 300)
        },
      }).go()
    }, 300)
  }

  useEffect(() => () => {
    clearInterval(heartTimerRef.current)
    clearTimeout(musicTimerRef.current)
    if (audioCtxRef.current) audioCtxRef.current.close()
  }, [])

  return (
    <div className="card-root">
      <div className="card-bg-wrap">
        <img src={bgImage} alt="" className={`card-wallpaper${wallZoom ? ' zoomed' : ''}`} />
        <div className="card-overlay" />
      </div>

      {hearts.map(h => (
        <div key={h.id} className="heart-icon" style={{ left: `${h.left}vw`, animationDuration: `${h.duration}s` }}>
          <svg viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      ))}

      <div className="glass-card">
        {stage === 'intro' && (
          <>
            <div className="ft-awal"><img src={pandaputih} alt="character" /></div>
            <div className="love-in" onClick={handleHeartClick}>
              <div className="love-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            </div>
            <p className="ket">Touch to Open, {recipientName}! 💖</p>
          </>
        )}

        {stage === 'slider' && (
          <div className={`slider-wrap${sliderReady ? ' ready' : ''}`}>
            <div className="slide">
              <img src={SLIDES[slideIndex].img} alt="" className="slide-img" />
              {SLIDES[slideIndex].fancy
                ? <span className="slide-text ft">{SLIDES[slideIndex].text}</span>
                : <span className="slide-text">
                    {SLIDES[slideIndex].text.split('\n').map((line, i, arr) => (
                      <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                    ))}
                  </span>
              }
            </div>
            <div className={`tombol${btnVisible ? ' visible' : ''}`}>
              <button onClick={handleSwipe}>{btnLabel}</button>
            </div>
          </div>
        )}

        {stage === 'final' && (
          <blockquote className={`bq${isTyping ? ' typing' : ''}`}>
            {photoUrl && (
              <div className="final-heart-photo">
                <img src={photoUrl} alt={recipientName} />
              </div>
            )}
            <p className="teksnim">{occ.cardTitle}</p>
            <p className="kalimat" ref={kalimatRef} />
          </blockquote>
        )}
      </div>

      {onBack && (
        <button className="back-toggle" onClick={onBack} title="Go back">← Back</button>
      )}

      <button className="music-toggle" onClick={toggleMusic} title="Toggle music">
        {musicOn ? '🔊' : '🔇'}
      </button>

      {shareUrl && (
        <button className="share-toggle" onClick={handleCopyLink} title="Copy shareable link">
          {copied ? '✅ Copied!' : '🔗 Share'}
        </button>
      )}

      <div className="rahul-branding">
        <b>made with ❤️ by <span>@vijayprasanth</span></b>
      </div>
    </div>
  )
}
