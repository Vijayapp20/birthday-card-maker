import { useState, useEffect } from 'react'
import api from './api'
import BirthdayForm from './components/BirthdayForm'
import BirthdayCard from './components/BirthdayCard'

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
        })
      })
      .catch(() => {
        setError('This birthday card link is invalid or has expired.')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', color: '#fff', fontFamily: 'sans-serif', fontSize: '1.2rem'
      }}>
        Loading your birthday card... 🎂
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
    return <BirthdayCard cardData={cardData} onBack={isSharedView ? undefined : () => {
      // Clear any ?card=ID from the URL and go back to the form
      window.history.replaceState({}, '', window.location.pathname)
      setCardData(null)
    }} />
  }

  return <BirthdayForm onStart={setCardData} />
}
