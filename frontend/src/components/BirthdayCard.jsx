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

// Map character key → imported gif asset
const GIF_MAP = { pusn, mikir, cilukba, g5, mndkat, pandaputih, pandapanah }

// Occasion-based content config
const OCCASION_CONFIG = {
  birthday:    { cardTitle: 'Happy Level Up Day! 🥳',      slide1: 'Hey {name} 🤭❤️',           slide3: "It's your Birthday today! 🎂",    slide5: 'Wishing you a long life\nand good health always 🥰' },
  anniversary: { cardTitle: 'Happy Anniversary! 💍',        slide1: 'Hey {name} 💕',               slide3: 'Celebrating your special day! 💍', slide5: 'Wishing you endless love\nand happiness together 🥰' },
  graduation:  { cardTitle: 'Congratulations! 🎓',          slide1: 'Hey {name} 🎉',               slide3: 'You did it! 🎓',                   slide5: 'Wishing you great success\nin all your future endeavors! 🚀' },
  newjob:      { cardTitle: 'Congrats on the New Role! 🚀', slide1: 'Hey {name} 💼',               slide3: 'A new chapter begins! 💼',         slide5: 'Wishing you tremendous success\nin your new journey! ⭐' },
  babyshower:  { cardTitle: 'Welcome Little One! 👶',       slide1: 'Hey {name} 🍼',               slide3: 'A new blessing arrives! 👶',       slide5: 'Wishing your family\njoy and love always 💕' },
  newhome:     { cardTitle: 'Welcome to Your New Home! 🏠', slide1: 'Hey {name} 🏠',               slide3: 'A new beginning awaits! 🏠',       slide5: 'Wishing you warmth and joy\nin your beautiful new home 🌟' },
  engagement:  { cardTitle: 'Congratulations! 💑',          slide1: 'Hey {name} 💑',               slide3: 'A beautiful journey begins! 💑',   slide5: 'Wishing you a lifetime\nof love and happiness together 💕' },
}



// For custom occasions, generate config dynamically
function getOccasionConfig(occasionType) {
  if (OCCASION_CONFIG[occasionType]) return OCCASION_CONFIG[occasionType]
  const label = occasionType.charAt(0).toUpperCase() + occasionType.slice(1)
  return {
    cardTitle: 'Congratulations! 🎉',
    slide1: 'Hey {name} 🎉',
    slide3: `Celebrating your ${label}! 🎊`,
    slide5: 'Wishing you all the best\nin this special moment 🥰'
  }
}

// Simple "Happy Birthday" melody synthesized with the Web Audio API.
// Avoids bundling any copyrighted audio files.
const HBD_NOTES = [
  // [frequency Hz, duration seconds]
  [392, 0.4], [392, 0.2], [440, 0.6], [392, 0.6], [523.25, 0.6], [493.88, 1.2],
  [392, 0.4], [392, 0.2], [440, 0.6], [392, 0.6], [587.33, 0.6], [523.25, 1.2],
  [392, 0.4], [392, 0.2], [783.99, 0.6], [659.25, 0.6], [523.25, 0.6], [493.88, 0.6], [440, 1.2],
  [698.46, 0.4], [698.46, 0.2], [659.25, 0.6], [523.25, 0.6], [587.33, 0.6], [523.25, 1.4],
]

function playHappyBirthdayTune(ctx, onDone) {
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
  const totalDuration = HBD_NOTES.reduce((sum, [, d]) => sum + d, 0)
  return setTimeout(onDone, totalDuration * 1000 + 300)
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
  const { recipientName, senderName, relationship, message, photoUrl, shareId, characterGif, occasionType } = cardData

  // Resolve chosen character gif (fallback to g5 if unknown key)
  const chosenGif = GIF_MAP[characterGif] || g5

  // Resolve occasion config (fallback to birthday)
  const occ = getOccasionConfig(occasionType || 'birthday')

  // Build dynamic slides using user data
  const SLIDES = [
    { img: pusn,      text: occ.slide1.replace('{name}', recipientName),    fancy: false },
    { img: mikir,     text: `I Just Want To\nSay To You 😆`,               fancy: false },
    { img: cilukba,   text: occ.slide3,                                      fancy: false },
    { img: chosenGif, text: `Happy ${occ.cardTitle.split('!')[0].replace(/Happy /,'').replace(/Congratulations/,'Congratulations').trim()}\n${recipientName}! 🎉`, fancy: true  },
    { img: mndkat,    text: occ.slide5,                                      fancy: false },
  ]

  const [stage,      setStage]      = useState('intro')
  const [isTyping,   setIsTyping]   = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [btnLabel,   setBtnLabel]   = useState('Swipe 👉')
  const [btnVisible, setBtnVisible] = useState(false)
  const [sliderReady,setSliderReady]= useState(false)
  const [wallZoom,   setWallZoom]   = useState(false)
  const [hearts,     setHearts]     = useState([])
  const [musicOn,    setMusicOn]    = useState(false)
  const [copied,     setCopied]     = useState(false)

  const audioCtxRef   = useRef(null)
  const musicTimerRef = useRef(null)

  const kalimatRef    = useRef(null)
  const heartTimerRef = useRef(null)
  const heartIdRef    = useRef(0)
  const busyRef       = useRef(false)

  // Background: always use the default wallpaper.
  // The uploaded photo is shown separately as a heart-shaped image
  // on the final card, not as the full-screen background.
  const bgImage = wp2

  const toggleMusic = useCallback(() => {
    if (musicOn) {
      clearTimeout(musicTimerRef.current)
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
        audioCtxRef.current = null
      }
      setMusicOn(false)
      return
    }

    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    audioCtxRef.current = ctx
    setMusicOn(true)

    const loop = () => {
      if (!audioCtxRef.current) return
      musicTimerRef.current = playHappyBirthdayTune(ctx, loop)
    }
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
    setTimeout(() => {
      setStage('slider')
      setSliderReady(true)
      setBtnVisible(true)
    }, 500)
  }, [])

  const handleSwipe = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    const nextIndex = slideIndex + 1

    if (slideIndex === SLIDES.length - 1) {
      await showGiftPopup()
      busyRef.current = false
      return
    }

    setBtnVisible(false)
    setTimeout(() => {
      setSlideIndex(nextIndex)
      if (nextIndex === SLIDES.length - 1) setBtnLabel('💌 Open Gift')
      setBtnVisible(true)
      busyRef.current = false
    }, 500)
  }, [slideIndex])

  async function showGiftPopup() {
    const swals = Swal.mixin({ allowOutsideClick: false, showConfirmButton: true })
    const swalst = Swal.mixin({ timer: 2600, allowOutsideClick: false, showConfirmButton: false, timerProgressBar: true })

    const { isConfirmed } = await swals.fire({
      title: 'Do you want a gift? 🤭❤️',
      imageUrl: pandaputih,
      imageWidth: 100,
      imageHeight: 100,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      cancelButtonColor: '#555',
    })

    let poinjwb = 1
    if (isConfirmed) {
      await swalst.fire({
        title: 'Just kidding! 🤣',
        html: 'No gift for you 😜❤️',
        imageUrl: weee,
        imageWidth: 100,
        imageHeight: 100,
      })
    } else {
      await swals.fire({
        title: 'Oh no!',
        html: "Alright, if you don't want it 😜❤️",
        imageUrl: ngumpet,
        imageWidth: 100,
        imageHeight: 100,
      })
      poinjwb = 2
    }
    showFinal(poinjwb)
  }

  function showFinal(poinjwb) {
    setStage('final')
    setWallZoom(true)

    setTimeout(() => {
      if (!kalimatRef.current) return

      const jokePrefix = poinjwb === 1 ? '<b>Just kidding haha 🤣</b><br /><br />' : 'Just Kidding 🤣<br /><br />'

      // Use user's custom/AI message
      const safeMessage = message.replace(/\n/g, '<br />')

      const fullHtml =
        jokePrefix +
        safeMessage +
        `<br /><br /><span class="ft">— From ${senderName} ✨</span>`

      // Disable the card's floating animation while typing — it
      // constantly shifts the message's position, which fights the
      // auto-scroll loop below and causes jittery scrolling.
      setIsTyping(true)

      let scrolling = true
      const smoothFollowScroll = () => {
        if (!scrolling || !kalimatRef.current) return
        const rect = kalimatRef.current.getBoundingClientRect()
        const targetY = window.scrollY + rect.bottom - window.innerHeight / 2
        // Ease toward the target position each frame instead of jumping,
        // so the scroll feels continuous instead of stop-start.
        const current = window.scrollY
        const next = current + (targetY - current) * 0.08
        if (Math.abs(targetY - current) > 1) {
          window.scrollTo(0, next)
        }
        requestAnimationFrame(smoothFollowScroll)
      }
      requestAnimationFrame(smoothFollowScroll)

      new TypeIt(kalimatRef.current, {
        strings: [fullHtml],
        startDelay: 50,
        speed: 30,
        cursor: true,
        html: true,
        afterComplete() {
          scrolling = false
          setIsTyping(false)
          if (kalimatRef.current) {
            kalimatRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
          }
          heartTimerRef.current = setInterval(() => {
            const id = heartIdRef.current++
            const left     = Math.random() * 95
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
      {/* Background */}
      <div className="card-bg-wrap">
        <img src={bgImage} alt="" className={`card-wallpaper${wallZoom ? ' zoomed' : ''}`} />
        <div className="card-overlay" />
      </div>

      {/* Falling hearts */}
      {hearts.map(h => (
        <div
          key={h.id}
          className="heart-icon"
          style={{ left: `${h.left}vw`, animationDuration: `${h.duration}s` }}
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
              2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
              C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
              c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      ))}

      {/* Glass card */}
      <div className="glass-card">

        {/* ── INTRO ── */}
        {stage === 'intro' && (
          <>
            <div className="ft-awal">
              <img src={pandaputih} alt="panda" />
            </div>
            <div className="love-in" onClick={handleHeartClick}>
              <div className="love-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                    2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                    C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
                    c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            </div>
            <p className="ket">Touch to Open, {recipientName}! 💖</p>
          </>
        )}

        {/* ── SLIDER ── */}
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

        {/* ── FINAL ── */}
        {stage === 'final' && (
          <blockquote className="bq">
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

      {/* Back */}
      {onBack && (
        <button className="back-toggle" onClick={onBack} title="Go back">
          ← Back
        </button>
      )}

      {/* Music toggle */}
      <button className="music-toggle" onClick={toggleMusic} title="Play/Pause birthday music">
        {musicOn ? '🔊' : '🔇'}
      </button>

      {/* Share */}
      {shareUrl && (
        <button className="share-toggle" onClick={handleCopyLink} title="Copy shareable link">
          {copied ? '✅ Copied!' : '🔗 Share'}
        </button>
      )}

      {/* Branding */}
      <div className="rahul-branding">
        <b>made with ❤️ by <span>@vijayprasanth</span></b>
      </div>
    </div>
  )
}
