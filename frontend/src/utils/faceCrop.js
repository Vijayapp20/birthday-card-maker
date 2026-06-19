// frontend/src/utils/faceCrop.js
//
// Detects a face in an uploaded image and crops the image to a fixed
// square size (CROP_SIZE x CROP_SIZE), centered on the detected face.
// Falls back to a plain center-crop if no face is found.
//
// Uses face-api.js with the lightweight "tiny face detector" model.
// Model weight files are loaded from a CDN at runtime so we don't have
// to bundle/ship the binary model files ourselves.

import * as faceapi from 'face-api.js'

export const CROP_SIZE = 800 // output is CROP_SIZE x CROP_SIZE px

// Validation limits for the *uploaded* photo, before cropping.
export const MIN_DIMENSION   = 800        // px — below this, upscaling would blur the face crop
export const MAX_DIMENSION   = 6000       // px — above this, rejected as unreasonably large
export const MAX_FILE_SIZE   = 15 * 1024 * 1024 // 15MB safety cap

export class PhotoValidationError extends Error {
  constructor(message, code) {
    super(message)
    this.code = code // 'TOO_SMALL' | 'TOO_LARGE' | 'FILE_TOO_BIG'
  }
}

const MODEL_URL =
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'

let modelsLoadedPromise = null

function loadModels() {
  if (!modelsLoadedPromise) {
    modelsLoadedPromise = faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
  }
  return modelsLoadedPromise
}

/**
 * Load an image File into an HTMLImageElement.
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Detect the largest face in an image element.
 * Returns the face bounding box { x, y, width, height } or null.
 */
async function detectFace(img) {
  try {
    await loadModels()
    const detections = await faceapi.detectAllFaces(
      img,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 })
    )
    if (!detections || detections.length === 0) return null

    // Pick the largest face (by box area) in case of multiple faces.
    let best = detections[0].box
    for (const d of detections) {
      const box = d.box
      if (box.width * box.height > best.width * best.height) best = box
    }
    return best
  } catch (err) {
    console.warn('Face detection failed, falling back to center crop:', err)
    return null
  }
}

/**
 * Crop an image to CROP_SIZE x CROP_SIZE, centered on the given point
 * (in source-image pixel coordinates). Clamps so the crop box stays
 * within the source image bounds.
 */
function drawCroppedSquare(img, centerX, centerY) {
  const canvas = document.createElement('canvas')
  canvas.width = CROP_SIZE
  canvas.height = CROP_SIZE
  const ctx = canvas.getContext('2d')

  // Source square side length: as large as possible while fitting in
  // the image, so we get good resolution and a tight-ish crop.
  const srcSize = Math.min(img.naturalWidth, img.naturalHeight)

  let sx = centerX - srcSize / 2
  let sy = centerY - srcSize / 2

  // Clamp so the crop box doesn't go outside the source image.
  sx = Math.max(0, Math.min(sx, img.naturalWidth - srcSize))
  sy = Math.max(0, Math.min(sy, img.naturalHeight - srcSize))

  ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, CROP_SIZE, CROP_SIZE)
  return canvas
}

/**
 * Convert a canvas to a File (jpeg), preserving a sensible filename.
 */
function canvasToFile(canvas, originalFile) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas toBlob failed'))
        const baseName = (originalFile.name || 'photo').replace(/\.[^.]+$/, '')
        const file = new File([blob], `${baseName}-cropped.jpg`, {
          type: 'image/jpeg',
        })
        resolve(file)
      },
      'image/jpeg',
      0.92
    )
  })
}

/**
 * Validate file size and pixel dimensions before we attempt any
 * cropping work. Throws PhotoValidationError on failure.
 */
function validateImage(file, img) {
  if (file.size > MAX_FILE_SIZE) {
    throw new PhotoValidationError(
      `Photo is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please choose a file under ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
      'FILE_TOO_BIG'
    )
  }

  const { naturalWidth: w, naturalHeight: h } = img

  if (w < MIN_DIMENSION || h < MIN_DIMENSION) {
    throw new PhotoValidationError(
      `Photo resolution is too low (${w}×${h}px). Please upload a photo at least ${MIN_DIMENSION}×${MIN_DIMENSION}px.`,
      'TOO_SMALL'
    )
  }

  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    throw new PhotoValidationError(
      `Photo resolution is too high (${w}×${h}px). Please upload a photo no larger than ${MAX_DIMENSION}×${MAX_DIMENSION}px.`,
      'TOO_LARGE'
    )
  }
}

/**
 * Main entry point.
 *
 * Given a raw image File, returns:
 *   {
 *     file: File,        // CROP_SIZE x CROP_SIZE jpeg, face-centered
 *     previewUrl: string,// object URL for the cropped file
 *     faceDetected: boolean,
 *   }
 */
export async function autoCropToFace(file) {
  const img = await loadImage(file)

  validateImage(file, img)

  const face = await detectFace(img)

  let centerX, centerY
  if (face) {
    centerX = face.x + face.width / 2
    centerY = face.y + face.height / 2
  } else {
    // Fallback: plain center crop.
    centerX = img.naturalWidth / 2
    centerY = img.naturalHeight / 2
  }

  const canvas = drawCroppedSquare(img, centerX, centerY)
  const croppedFile = await canvasToFile(canvas, file)
  const previewUrl = URL.createObjectURL(croppedFile)

  URL.revokeObjectURL(img.src)

  return {
    file: croppedFile,
    previewUrl,
    faceDetected: !!face,
  }
}
