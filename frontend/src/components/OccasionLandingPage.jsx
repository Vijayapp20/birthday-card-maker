import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import BirthdayForm from './BirthdayForm'
import OccasionLinks from './OccasionLinks'
import './OccasionLandingPage.css'

// One ready-to-copy wish with a "Copy" button — people searching for wishes
// mostly want text they can paste straight into WhatsApp or a card.
function WishItem({ text }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked (older browsers / insecure context) — nothing else to do
    }
  }

  return (
    <li className="wish-item">
      <span className="wish-text">{text}</span>
      <button type="button" className="wish-copy" onClick={copy} aria-label="Copy this wish">
        {copied ? 'Copied ✓' : 'Copy'}
      </button>
    </li>
  )
}

// Renders a dedicated, crawlable landing page for one occasion
// (e.g. /wedding-wishes): real static text for Google (intro + 30 wishes),
// the same form underneath pre-set to that occasion, and links to the other
// occasion pages so crawlers can discover them.
export default function OccasionLandingPage({ seo, occasionKey, onStart }) {
  const canonical = `https://celebration-wishes.vercel.app${seo.path}`

  return (
    <div className="occasion-landing">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.metaDescription} />
        <meta property="og:url" content={canonical} />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.metaDescription} />
        <meta name="twitter:url" content={canonical} />
      </Helmet>

      <div className="occasion-seo-content">
        <h1>{seo.h1}</h1>
        <p className="occasion-intro">{seo.intro}</p>
        <a className="occasion-cta" href="#create-card">Make a personalised card ✨</a>

        {seo.wishGroups?.length > 0 && (
          <section className="occasion-samples">
            <h2>{seo.wishesHeading || 'Sample Wishes'}</h2>
            {seo.wishGroups.map(group => (
              <div className="wish-group" key={group.heading}>
                <h3>{group.heading}</h3>
                <ul>
                  {group.wishes.map(w => <WishItem key={w} text={w} />)}
                </ul>
              </div>
            ))}
          </section>
        )}
      </div>

      <div id="create-card">
        <BirthdayForm onStart={onStart} initialOccasion={occasionKey} />
      </div>

      <OccasionLinks currentKey={occasionKey} />
    </div>
  )
}
