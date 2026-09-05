// Backing music for the "sung" poem playback, built with Tone.js instead of
// raw Web Audio oscillators — proper synth voices, an envelope per note, and
// a touch of reverb, so it actually sounds like a soft instrumental backing
// track rather than a plain droning pad.
//
// Tone.js is loaded via a dynamic import() inside startMelodyBacking, not a
// static import — so it's only fetched the moment someone taps "Play poem",
// not whenever the Gift Box template itself loads.
import { getOccasionScale } from './giftSound'

let padSynth = null
let sparkleSynth = null

function ensureInstruments(Tone) {
  if (padSynth) return
  const reverb = new Tone.Reverb({ decay: 2.2, wet: 0.32 }).toDestination()

  // Warm sustained chord — carries the melody line by line
  padSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.5, decay: 0.3, sustain: 0.55, release: 1.4 },
  }).connect(reverb)
  padSynth.volume.value = -16 // stays soft, sits under the voice

  // Light music-box-style pluck — used to accent individual spoken words
  sparkleSynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.25, sustain: 0, release: 0.2 },
  }).connect(reverb)
  sparkleSynth.volume.value = -22
}

// Starts the backing track for one poem-reading session. Returns
// { stop, pulse, glideToStep } — the same shape as the plain Web Audio
// pad it replaces, so GiftBoxCard doesn't need to know which one is active.
//   - glideToStep(i) plays/holds a soft chord for poem line i (call this
//     when that line starts speaking)
//   - pulse() adds a tiny sparkle note — call on each spoken word
//   - stop() releases everything cleanly
export async function startMelodyBacking(occasionType) {
  const Tone = await import('tone') // fetched on first use only
  await Tone.start() // resume the shared AudioContext — must follow a user gesture, which the Play button provides
  ensureInstruments(Tone)

  const scale = getOccasionScale(occasionType).map((f) => f / 2) // one octave down — a pad, not the chime itself
  let stopped = false
  let sparkleStep = 0

  function glideToStep(stepIndex) {
    if (stopped) return
    const root = scale[((stepIndex % scale.length) + scale.length) % scale.length]
    const fifth = root * 1.5 // simple perfect-fifth harmony for a fuller chord
    padSynth.releaseAll()
    padSynth.triggerAttack([root, fifth], Tone.now())
  }

  function pulse() {
    if (stopped) return
    // Alternate between the root and a note above it so the sparkles feel
    // melodic rather than a single repeated blip.
    const root = scale[sparkleStep % scale.length]
    const note = sparkleStep % 2 === 0 ? root * 2 : root * 2.25
    sparkleSynth.triggerAttackRelease(note, '16n', Tone.now())
    sparkleStep += 1
  }

  function stop() {
    if (stopped) return
    stopped = true
    padSynth.releaseAll()
  }

  return { stop, pulse, glideToStep }
}
