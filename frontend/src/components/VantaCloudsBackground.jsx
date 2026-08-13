import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import CLOUDS2 from 'vanta/dist/vanta.clouds2.min'

/**
 * Full-bleed animated 3D drifting-clouds background — used on the Letter
 * template instead of the dark FOG effect (see VantaBackground.jsx), since
 * the letter's whole aesthetic is bright warm parchment/daylight, not
 * moody atmosphere. Same idea, different mood.
 */
export default function VantaCloudsBackground({ skyColor, cloudColor, speed = 0.9 }) {
  const hostRef = useRef(null)
  const effectRef = useRef(null)

  useEffect(() => {
    effectRef.current = CLOUDS2({
      el: hostRef.current,
      THREE,
      mouseControls: false,
      touchControls: false,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      skyColor,
      cloudColor,
      speed,
    })
    return () => {
      effectRef.current?.destroy()
      effectRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    effectRef.current?.setOptions?.({ skyColor, cloudColor, speed })
  }, [skyColor, cloudColor, speed])

  return <div ref={hostRef} className="lc-vanta-bg" />
}
