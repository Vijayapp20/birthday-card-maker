import { useEffect, useRef } from 'react'

/**
 * Glowing particle heart — a soft cluster of twinkling dots shaped like a
 * heart, with faint constellation-style lines linking nearby particles.
 * Pure canvas, no extra deps. Meant to sit behind a single "fancy" slide.
 */
export default function HeartParticles({ color = '#ffeb3b', particleCount = 140 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let width = 0
    let height = 0
    let dpr = 1
    let particles = []
    let raf = 0
    let lastTime = performance.now()

    const hexToRgb = (hex) => {
      const clean = hex.replace('#', '')
      const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
      const num = parseInt(full, 16)
      return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
    }
    const { r, g, b } = hexToRgb(color)

    // Parametric heart curve (classic "16sin^3t" heart)
    const heartPoint = (t, scale) => {
      const x = 16 * Math.sin(t) ** 3
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
      return { x: x * scale, y: -y * scale }
    }

    const buildParticles = () => {
      const scale = Math.min(width, height) / 34
      particles = []
      for (let i = 0; i < particleCount; i++) {
        const t = Math.random() * Math.PI * 2
        const jitter = (Math.random() - 0.5) * scale * 1.8
        const base = heartPoint(t, scale)
        particles.push({
          x: width / 2 + base.x + jitter * Math.cos(t),
          y: height / 2 + base.y + jitter * Math.sin(t) - height * 0.03,
          r: Math.random() * 1.3 + 0.5,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.02 + 0.008,
          driftX: (Math.random() - 0.5) * 0.06,
          driftY: (Math.random() - 0.5) * 0.06,
        })
      }
    }

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      dpr = window.devicePixelRatio || 1
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildParticles()
    }

    const draw = (now) => {
      const dt = Math.min(now - lastTime, 48)
      lastTime = now
      ctx.clearRect(0, 0, width, height)

      // faint links between nearby particles (constellation look)
      const linkDist = Math.min(width, height) * 0.09
      ctx.lineWidth = 0.5
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i]
          const p2 = particles[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < linkDist) {
            const alpha = (1 - dist / linkDist) * 0.18
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }

      particles.forEach(p => {
        p.phase += p.speed * (dt / 16)
        p.x += p.driftX * (dt / 16)
        p.y += p.driftY * (dt / 16)
        const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(p.phase))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${twinkle})`
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }

    resize()
    raf = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [color, particleCount])

  return <canvas ref={canvasRef} className="heart-particles-canvas" />
}
