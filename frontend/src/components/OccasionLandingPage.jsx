import { Helmet } from 'react-helmet-async'
import BirthdayForm from './BirthdayForm'
import OccasionLinks from './OccasionLinks'
import './OccasionLandingPage.css'

// Renders a dedicated, crawlable landing page for one occasion
// (e.g. /anniversary-wishes): real static text for Google, the same
// form underneath pre-set to that occasion, and links to the other
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
      </Helmet>

      <div className="occasion-seo-content">
        <h1>{seo.h1}</h1>
        <p className="occasion-intro">{seo.intro}</p>

        {seo.samples?.length > 0 && (
          <div className="occasion-samples">
            <h2>Sample Wishes</h2>
            <ul>
              {seo.samples.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
      </div>

      <BirthdayForm onStart={onStart} initialOccasion={occasionKey} />

      <OccasionLinks currentKey={occasionKey} />
    </div>
  )
}
