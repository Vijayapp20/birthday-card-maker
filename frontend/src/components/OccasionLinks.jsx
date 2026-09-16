import { SEO_PAGE_LIST } from '../seoContent'
import './OccasionLinks.css'

// Plain <a> links (not client-side-only routing) so crawlers reliably see
// and follow them — this is what lets Google discover the other occasion
// pages from any single page instead of only from the sitemap.
export default function OccasionLinks({ currentKey }) {
  const others = SEO_PAGE_LIST.filter(p => p.key !== currentKey)
  if (others.length === 0) return null

  return (
    <nav className="occasion-links" aria-label="Other occasions">
      <h2>Explore Other Occasions</h2>
      <ul>
        {others.map(p => (
          <li key={p.key}>
            <a href={p.path}>{p.h1}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
