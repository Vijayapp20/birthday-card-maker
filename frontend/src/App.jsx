import { useState, useEffect } from 'react' // v2
import { ParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import api from './api'
import BirthdayForm from './components/BirthdayForm'
import BirthdayCard from './components/BirthdayCard'
import LetterCard from './components/LetterCard'

// Registers the lightweight ("slim") tsparticles engine once for the whole
// app, so individual <Particles> instances (see AmbientParticles.jsx) don't
// each pay the init cost.
const initParticles = async (engine) => { await loadSlim(engine) }

export default function App() {
  const [cardData, setCardData] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [isSharedView, setIsSharedView] = useState(false)

  // If the URL has ?card=ID, load that shared card instead of showing the form
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cardId = params.get('card')
    if (!cardId) return

    setIsSharedView(true)
    setLoading(true)
    api.get(`/api/cards/${cardId}`)
      .then(res => {
        const data = res.data
        setCardData({
          recipientName: data.recipientName,
          senderName: data.senderName,
          relationship: data.relationship,
          message: data.message,
          photoUrl: data.photoUrl,
          characterGif: data.characterGif || 'g5',
          occasionType: data.occasionType || 'birthday',
          template: data.template || 'photo',
        })
      })
      .catch(() => {
        setError('This celebration card link is invalid or has expired.')
      })
      .finally(() => setLoading(false))
  }, [])

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', color: '#fff', fontFamily: 'sans-serif', fontSize: '1.2rem'
        }}>
          Loading your celebration card... 🎉
        </div>
      )
    }

    if (error) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', color: '#fff', fontFamily: 'sans-serif', fontSize: '1.2rem',
          textAlign: 'center', padding: '0 20px'
        }}>
          ⚠️ {error}
        </div>
      )
    }

    if (cardData) {
      const onBack = isSharedView ? undefined : () => {
        // Clear any ?card=ID from the URL and go back to the form
        window.history.replaceState({}, '', window.location.pathname)
        setCardData(null)
      }
      return cardData.template === 'letter'
        ? <LetterCard cardData={cardData} onBack={onBack} />
        : <BirthdayCard cardData={cardData} onBack={onBack} />
    }

    return <BirthdayForm onStart={setCardData} />
  }

  return (
    <ParticlesProvider init={initParticles}>
      {renderContent()}
    </ParticlesProvider>
  )
}
