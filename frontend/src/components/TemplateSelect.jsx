import './TemplateSelect.css'

// Template picker shown after the form is submitted, before the final card renders.
// Purely presentational — receives the already-prepared card data and hands the
// chosen template key back up via onChoose. Doesn't touch any business logic.
export default function TemplateSelect({ recipientName, onChoose, onBack, saving }) {
  return (
    <div className="tpl-page">
      <div className="tpl-bg" />
      <div className="tpl-wrap">
        <div className="tpl-header">
          <span className="tpl-emoji">🎨</span>
          <h1>Choose a Style</h1>
          <p>{saving ? 'Preparing your card…' : `Pick how you'd like to surprise ${recipientName || 'them'}`}</p>
        </div>

        <div className="tpl-grid">
          <button type="button" className="tpl-card" disabled={saving} onClick={() => onChoose('photo')}>
            <div className="tpl-preview tpl-preview--photo">
              <span className="tpl-preview-icon">🎬</span>
            </div>
            <h3>Animated Slideshow</h3>
            <p>A playful photo card with swipeable slides, your chosen character &amp; a surprise gift moment</p>
          </button>

          <button type="button" className="tpl-card" disabled={saving} onClick={() => onChoose('letter')}>
            <div className="tpl-preview tpl-preview--letter">
              <span className="tpl-preview-icon">💌</span>
            </div>
            <h3>Handwritten Letter</h3>
            <p>A vintage envelope opens into an elegant, animated handwritten letter — no photo needed</p>
          </button>
        </div>

        {onBack && !saving && (
          <button type="button" className="tpl-back" onClick={onBack}>← Back to form</button>
        )}
      </div>
    </div>
  )
}
