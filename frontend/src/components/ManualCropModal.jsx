import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { CROP_SIZE } from '../utils/cropConstants'
import './ManualCropModal.css'

// Draws the user-picked crop area (in source-image pixel coords) onto a
// CROP_SIZE x CROP_SIZE canvas and returns it as a jpeg File — same output
// shape as autoCropToFace, so BirthdayForm can treat both the same way.
function getCroppedFile(imageSrc, cropPixels, originalFile) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = CROP_SIZE
      canvas.height = CROP_SIZE
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        img,
        cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
        0, 0, CROP_SIZE, CROP_SIZE
      )
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas toBlob failed'))
        const baseName = (originalFile.name || 'photo').replace(/\.[^.]+$/, '')
        resolve(new File([blob], `${baseName}-cropped.jpg`, { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.92)
    }
    img.onerror = reject
    img.src = imageSrc
  })
}

/**
 * Full-screen modal: drag to reposition, scroll/pinch to zoom, fixed 1:1
 * crop box. Used when the auto face-crop picks the wrong spot.
 */
export default function ManualCropModal({ file, onCancel, onConfirm }) {
  const [imageSrc]       = useState(() => URL.createObjectURL(file))
  const [crop, setCrop]   = useState({ x: 0, y: 0 })
  const [zoom, setZoom]   = useState(1)
  const [croppedPixels, setCroppedPixels] = useState(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedPixels(croppedAreaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedPixels) return
    setSaving(true)
    try {
      const croppedFile = await getCroppedFile(imageSrc, croppedPixels, file)
      const previewUrl = URL.createObjectURL(croppedFile)
      onConfirm({ file: croppedFile, previewUrl })
    } finally {
      setSaving(false)
      URL.revokeObjectURL(imageSrc)
    }
  }

  const handleCancel = () => {
    URL.revokeObjectURL(imageSrc)
    onCancel()
  }

  return (
    <div className="crop-modal-overlay">
      <div className="crop-modal">
        <h3>🎯 Adjust Photo</h3>
        <p className="crop-modal-hint">Drag to move · Pinch or scroll to zoom</p>

        <div className="crop-modal-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <input
          type="range" min={1} max={3} step={0.01} value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="crop-modal-zoom"
        />

        <div className="crop-modal-actions">
          <button type="button" className="crop-btn crop-btn--ghost" onClick={handleCancel} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="crop-btn crop-btn--primary" onClick={handleConfirm} disabled={saving || !croppedPixels}>
            {saving ? 'Saving…' : '✅ Use This Crop'}
          </button>
        </div>
      </div>
    </div>
  )
}
