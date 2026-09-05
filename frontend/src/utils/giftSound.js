// Short occasion-themed chime played when the gift box opens.
// Generated entirely with the Web Audio API (oscillator + gain envelope) —
// no audio files to host/download and no extra library, so this adds
// ~0 KB to the bundle.

const NOTE_PATTERNS = {
  birthday:    { wave: 'triangle', notes: [523.25, 659.25, 783.99, 1046.50], noteDuration: 0.14 }, // bright ascending
  anniversary: { wave: 'sine',     notes: [392.00, 493.88, 587.33, 783.99],  noteDuration: 0.22 }, // warm major chord
  engagement:  { wave: 'sine',     notes: [392.00, 493.88, 587.33, 783.99],  noteDuration: 0.22 }, // same warm feel
  graduation:  { wave: 'square',   notes: [523.25, 659.25, 783.99, 1046.50, 1318.51], noteDuration: 0.11 }, // little fanfare
  newjob:      { wave: 'triangle', notes: [440.00, 554.37, 659.25, 880.00],  noteDuration: 0.14 }, // confident rise
  newhome:     { wave: 'sine',     notes: [783.99, 659.25, 587.33, 523.25],  noteDuration: 0.18 }, // gentle descending bell
  babyshower:  { wave: 'sine',     notes: [880.00, 987.77, 1046.50, 1174.66], noteDuration: 0.2  }, // soft lullaby-ish
}
const DEFAULT_PATTERN = NOTE_PATTERNS.birthday

let sharedCtx = null
function getContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  if (!sharedCtx) sharedCtx = new AudioCtx()
  return sharedCtx
}

export function playOccasionChime(occasionType) {
  const ctx = getContext()
  if (!ctx) return // Web Audio unsupported — fail silently, sound is a nice-to-have
  if (ctx.state === 'suspended') ctx.resume()

  const { wave, notes, noteDuration } = NOTE_PATTERNS[occasionType] || DEFAULT_PATTERN
  let t = ctx.currentTime

  notes.forEach((freq) => {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = wave
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + noteDuration)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + noteDuration + 0.02)
    t += noteDuration * 0.85 // slight overlap between notes for a smoother run
  })
}

// Soft looping background pad meant to sit *under* speech (e.g. while the
// poem is being read aloud). Three gently detuned sine waves through a
// lowpass filter, kept quiet so it never competes with the voice. Returns
// a stop() function that fades the pad out cleanly.
export function startAmbientPad(occasionType) {
  const ctx = getContext()
  if (!ctx) return () => {}
  if (ctx.state === 'suspended') ctx.resume()

  const { notes } = NOTE_PATTERNS[occasionType] || DEFAULT_PATTERN
  const root = notes[0] / 2 // one octave down — a pad, not the chime itself

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 900

  const masterGain = ctx.createGain()
  masterGain.gain.setValueAtTime(0, ctx.currentTime)
  masterGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.2) // slow fade-in, deliberately quiet
  filter.connect(masterGain).connect(ctx.destination)

  const oscillators = [0, 7, -7].map((detuneCents) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = root
    osc.detune.value = detuneCents
    osc.connect(filter)
    osc.start()
    return osc
  })

  let stopped = false
  return function stop() {
    if (stopped) return
    stopped = true
    const now = ctx.currentTime
    masterGain.gain.cancelScheduledValues(now)
    masterGain.gain.setValueAtTime(masterGain.gain.value, now)
    masterGain.gain.linearRampToValueAtTime(0, now + 0.6)
    oscillators.forEach((osc) => osc.stop(now + 0.65))
  }
}
