// frontend/src/utils/nsfwFilter.js
//
// Checks an uploaded photo for adult/NSFW content BEFORE it's cropped or
// sent to the backend. Runs entirely in the browser via nsfwjs (a
// TensorFlow.js model) — the photo never has to leave the device just to
// be checked, and nothing is uploaded until this check passes.
//
// Importing nsfwjs's top-level index also pulls in its much larger
// InceptionV3 model (tens of MB) alongside the small MobileNetV2 one, so
// we import the MobileNetV2 model directly instead — a few MB, fetched
// on demand the first time someone picks a photo (same lazy-loading
// pattern as the face-api.js models in faceCrop.js).
import { load as loadCore } from 'nsfwjs/core'
import { MobileNetV2Model } from 'nsfwjs/models/mobilenet_v2'

export class NsfwValidationError extends Error {
  constructor(message) {
    super(message)
    this.code = 'NSFW_BLOCKED'
  }
}

// nsfwjs classifies into 5 buckets: Drawing, Hentai, Neutral, Porn, Sexy.
// We block clearly adult content; "Sexy" (suggestive but not explicit) is
// judged with a higher bar so normal beach/swimwear photos aren't caught.
const BLOCK_THRESHOLDS = {
  Porn: 0.55,
  Hentai: 0.55,
  Sexy: 0.80,
}

let modelPromise = null
function loadModel() {
  if (!modelPromise) {
    modelPromise = loadCore(MobileNetV2Model.name, { modelDefinitions: [MobileNetV2Model] })
  }
  return modelPromise
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Throws NsfwValidationError if the photo is flagged as adult content.
 * Resolves silently (no return value needed) if the photo looks fine.
 */
export async function assertPhotoIsSafe(file) {
  const img = await loadImage(file)
  try {
    const model = await loadModel()
    const predictions = await model.classify(img)
    const flagged = predictions.find(
      (p) => BLOCK_THRESHOLDS[p.className] !== undefined && p.probability >= BLOCK_THRESHOLDS[p.className]
    )
    if (flagged) {
      throw new NsfwValidationError(
        'This photo looks like it may contain adult content and can\u2019t be used here. Please choose a different photo.'
      )
    }
  } finally {
    URL.revokeObjectURL(img.src)
  }
}
