import * as opentype from 'opentype.js'
import fontUrl from '../assets/fonts/Caveat-Variable.ttf'

let fontPromise = null

// Loads and parses the real handwriting font file once (cached), giving us
// actual vector glyph outlines via font.getPath(...) — this is what lets
// HandwritingText.jsx trace real pen strokes instead of faking it with a
// typewriter reveal on a webfont.
export function loadHandwritingFont() {
  if (!fontPromise) {
    fontPromise = fetch(fontUrl)
      .then(res => res.arrayBuffer())
      .then(buf => opentype.parse(buf))
  }
  return fontPromise
}
