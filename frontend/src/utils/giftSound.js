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
// lowpass filter, kept quiet so it never competes with the voice.
//
// Returns { stop, pulse }:
//   - pulse() nudges the volume up-and-back-down briefly — call it on each
//     spoken word (via SpeechSynthesisUtterance's onboundary event) so the
//     music audibly breathes in time with the poem instead of just droning
//     underneath it.
//   - stop() fades the whole pad out cleanly.
const PAD_BASE_GAIN = 0.05
const PAD_PULSE_GAIN = 0.09

export function startAmbientPad(occasionType) {
  const noop = () => {}
  const ctx = getContext()
  if (!ctx) return { stop: noop, pulse: noop, glideToStep: noop }
  if (ctx.state === 'suspended') ctx.resume()

  const { notes } = NOTE_PATTERNS[occasionType] || DEFAULT_PATTERN
  const scaleNotes = notes.map((f) => f / 2) // pad-octave version of the chime's scale
  const root = scaleNotes[0]

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 900

  const masterGain = ctx.createGain()
  masterGain.gain.setValueAtTime(0, ctx.currentTime)
  masterGain.gain.linearRampToValueAtTime(PAD_BASE_GAIN, ctx.currentTime + 1.2) // slow fade-in, deliberately quiet
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

  function pulse() {
    if (stopped) return
    const now = ctx.currentTime
    masterGain.gain.cancelScheduledValues(now)
    masterGain.gain.setValueAtTime(masterGain.gain.value, now)
    masterGain.gain.linearRampToValueAtTime(PAD_PULSE_GAIN, now + 0.08)
    masterGain.gain.linearRampToValueAtTime(PAD_BASE_GAIN, now + 0.35)
  }

  // Glides the pad's pitch to the next note in the occasion's scale — call
  // this at the start of each poem line so the music's melody follows the
  // reading, like a soft hum backing a singer.
  function glideToStep(stepIndex) {
    if (stopped) return
    const target = scaleNotes[((stepIndex % scaleNotes.length) + scaleNotes.length) % scaleNotes.length]
    const now = ctx.currentTime
    oscillators.forEach((osc) => {
      osc.frequency.cancelScheduledValues(now)
      osc.frequency.setValueAtTime(osc.frequency.value, now)
      osc.frequency.linearRampToValueAtTime(target, now + 0.4)
    })
  }

  function stop() {
    if (stopped) return
    stopped = true
    const now = ctx.currentTime
    masterGain.gain.cancelScheduledValues(now)
    masterGain.gain.setValueAtTime(masterGain.gain.value, now)
    masterGain.gain.linearRampToValueAtTime(0, now + 0.6)
    oscillators.forEach((osc) => osc.stop(now + 0.65))
  }

  return { stop, pulse, glideToStep }
}
