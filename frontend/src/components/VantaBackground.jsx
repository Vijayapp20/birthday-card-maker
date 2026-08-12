import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import FOG from 'vanta/dist/vanta.fog.min'

/**
 * Full-bleed animated 3D fog background (vanta.js + three.js) — replaces
 * the old static wallpaper + CSS blobs with a genuinely living background
 * that never stops moving. Colors are occasion-tinted (see occasions.js).
 */
export default function VantaBackground({ highlightColor, midtoneColor, lowlightColor, baseColor, intense = false }) {
  const hostRef = useRef(null)
  const effectRef = useRef(null)

  useEffect(() => {
    effectRef.current = FOG({
      el: hostRef.current,
      THREE,
      mouseControls: false,
      touchControls: false,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      highlightColor,
      midtoneColor,
      lowlightColor,
      baseColor,
      blurFactor: 0.65,
      speed: 1.3,
      zoom: 1,
    })
    return () => {
      effectRef.current?.destroy()
      effectRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-tint smoothly (no remount) if the occasion changes mid-session
  useEffect(() => {
    effectRef.current?.setOptions?.({ highlightColor, midtoneColor, lowlightColor, baseColor })
  }, [highlightColor, midtoneColor, lowlightColor, baseColor])

  // A brief "intensify" moment (faster + more zoomed) for the final reveal beat
  useEffect(() => {
    effectRef.current?.setOptions?.({ speed: intense ? 2.4 : 1.3, zoom: intense ? 1.35 : 1 })
  }, [intense])

  return <div ref={hostRef} className="vanta-bg" />
}
