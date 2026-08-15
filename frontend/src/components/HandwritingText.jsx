import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { loadHandwritingFont } from '../utils/handwritingFont'

const MS_PER_CHAR = 42     // roughly how fast the "pen" travels per character
const MIN_LINE_MS = 260
const LINE_GAP_MS = 90

function wrapLine(font, text, fontSize, maxWidth) {
  if (!text) return ['']
  const words = text.split(' ')
  const lines = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    const w = font.getAdvanceWidth(test, fontSize)
    if (w > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

/**
 * Renders text as real hand-drawn ink: each line is an actual SVG path
 * traced from the font's own glyph outlines (via opentype.js), animated
 * stroke-first (the "pen" tracing the letterforms) then filled solid (the
 * "ink" settling in behind it) — not a monospaced typewriter reveal.
 *
 * Props:
 *  - blocks: [{ text, size: 'greeting'|'body'|'closing'|'sign', break?: boolean }]
 *  - width: available width in px for line-wrapping
 *  - active: only builds + plays once this becomes true
 *  - onComplete: called once after the last line finishes
 */
export default function HandwritingText({ blocks, width, active, onComplete, color = '#4a3423', inkColor = '#3a2818' }) {
  const svgRef = useRef(null)
  const penRef = useRef(null)
  const lineRefs = useRef([])
  const [lines, setLines] = useState(null) // built layout, once font + width are ready
  const startedRef = useRef(false)

  const scale = Math.min(1.18, Math.max(0.82, width / 380))
  const FONT_SIZE = {
    greeting: 24 * scale, body: 24 * scale, closing: 24 * scale, sign: 30 * scale,
  }
  const LINE_HEIGHT_MULT = 1.62

  const buildLayout = useCallback(async () => {
    if (!width || width < 40) return
    const font = await loadHandwritingFont()

    const out = []
    let y = 0
    for (const block of blocks) {
      if (block.break) {
        y += FONT_SIZE.body * LINE_HEIGHT_MULT * 0.7
        continue
      }
      const size = FONT_SIZE[block.size] || FONT_SIZE.body
      const wrapped = wrapLine(font, block.text, size, width)
      const lineHeight = size * LINE_HEIGHT_MULT
      const ascent = size * (font.ascender / font.unitsPerEm)

      for (const lineText of wrapped) {
        const path = font.getPath(lineText, 0, ascent, size)
        const d = path.toPathData(2)
        const advance = font.getAdvanceWidth(lineText, size)
        out.push({ d, y, height: lineHeight, size, advance, charCount: Math.max(lineText.length, 1) })
        y += lineHeight
      }
    }
    setLines({ items: out, totalHeight: y })
  }, [blocks, width])

  useEffect(() => {
    if (!active || startedRef.current) return
    startedRef.current = true
    buildLayout()
  }, [active, buildLayout])

  // Once the layout is built and the <path> elements exist in the DOM,
  // measure each real path length and run the stroke->fill timeline.
  useEffect(() => {
    if (!lines || !active) return
    const tl = gsap.timeline({ onComplete })

    lines.items.forEach((line, i) => {
      const strokeEl = lineRefs.current[i]?.stroke
      const fillEl = lineRefs.current[i]?.fill
      if (!strokeEl || !fillEl) return

      const len = strokeEl.getTotalLength()
      gsap.set(strokeEl, { strokeDasharray: len, strokeDashoffset: len })
      gsap.set(fillEl, { fillOpacity: 0 })

      const duration = Math.max(MIN_LINE_MS, line.charCount * MS_PER_CHAR) / 1000
      const baselineY = line.y + line.height * 0.55

      tl.set(penRef.current, { attr: { cx: 0, cy: baselineY } })
        .to(strokeEl, { strokeDashoffset: 0, duration, ease: 'none' })
        .to(penRef.current, { attr: { cx: line.advance, cy: baselineY }, duration, ease: 'none' }, '<')
        .to(fillEl, { fillOpacity: 1, duration: duration * 0.85, ease: 'none' }, '<+=0.08')
        .to({}, { duration: LINE_GAP_MS / 1000 })
    })

    return () => tl.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines])

  if (!lines) {
    // Reserve roughly the right amount of vertical space while the font
    // loads/layout builds, so the paper doesn't jump once ready.
    return <div style={{ minHeight: 160 }} />
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${lines.totalHeight}`}
      width="100%"
      height={lines.totalHeight}
      style={{ overflow: 'visible', display: 'block' }}
    >
      {lines.items.map((line, i) => (
        <g key={i} transform={`translate(0, ${line.y})`}>
          <path
            ref={el => { lineRefs.current[i] = { ...(lineRefs.current[i] || {}), fill: el } }}
            d={line.d}
            fill={inkColor}
            fillOpacity={0}
          />
          <path
            ref={el => { lineRefs.current[i] = { ...(lineRefs.current[i] || {}), stroke: el } }}
            d={line.d}
            fill="none"
            stroke={color}
            strokeWidth={Math.max(1.1, line.size * 0.05)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
      {/* The traveling ink point — a small dot tracking where the "pen" currently is */}
      <circle ref={penRef} cx="0" cy="0" r="2.4" fill={inkColor} opacity="0.85" />
    </svg>
  )
}
