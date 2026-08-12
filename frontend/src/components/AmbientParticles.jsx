import { useMemo } from 'react'
import Particles from '@tsparticles/react'
import { useParticlesProvider } from '@tsparticles/react'

/**
 * Soft floating sparkle/bokeh particles — a subtle ambient layer that gives
 * the background depth without competing with the card content on top.
 * Kept lightweight: low particle count, no interactivity, no lines.
 * The engine itself is registered once at the app root (see App.jsx).
 */
export default function AmbientParticles({ color = '#ffffff', count = 26 }) {
  const { loaded } = useParticlesProvider()

  const options = useMemo(() => ({
    fullScreen: { enable: false },
    fpsLimit: 60,
    detectRetina: true,
    particles: {
      number: { value: count, density: { enable: true, area: 900 } },
      color: { value: color },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.15, max: 0.6 },
        animation: { enable: true, speed: 0.6, sync: false, startValue: 'random' },
      },
      size: { value: { min: 1, max: 3.5 } },
      move: {
        enable: true, speed: 0.5, direction: 'top', straight: false,
        random: true, outModes: { default: 'out' },
      },
      links: { enable: false },
    },
    interactivity: { events: { onHover: { enable: false }, onClick: { enable: false } } },
    background: { color: 'transparent' },
  }), [color, count])

  if (!loaded) return null

  return (
    <Particles
      id="ambient-particles"
      options={options}
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  )
}
