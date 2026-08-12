// Shared occasion-based content config — used by BOTH Template 1 (BirthdayCard)
// and Template 2 (LetterCard) so the copy stays consistent and logic isn't duplicated.

export const OCCASION_CONFIG = {
  birthday:    { cardTitle: 'Happy Level Up Day! 🥳',       slide1: 'Hey {name} 🤭❤️',  slide3: "It's your special day! 🎂",       slide5: 'Wishing you a long life\nand good health always 🥰', bgGradient: 'linear-gradient(160deg, rgba(255,117,140,0.55) 0%, rgba(0,0,0,0.55) 60%)', particleColor: '#ffb3c6' },
  anniversary: { cardTitle: 'Happy Anniversary! 💍',         slide1: 'Hey {name} 💕',    slide3: 'Celebrating your love! 💍',        slide5: 'Wishing you endless love\nand happiness together 🥰', bgGradient: 'linear-gradient(160deg, rgba(196,30,58,0.55) 0%, rgba(30,10,20,0.6) 65%)', particleColor: '#ffcad4' },
  graduation:  { cardTitle: 'Congratulations! 🎓',           slide1: 'Hey {name} 🎉',    slide3: 'You did it! 🎓',                   slide5: 'Wishing you great success\nin all your future endeavors! 🚀', bgGradient: 'linear-gradient(160deg, rgba(58,58,150,0.55) 0%, rgba(10,10,35,0.6) 65%)', particleColor: '#a8b8ff' },
  newjob:      { cardTitle: 'Congrats on the New Role! 🚀',  slide1: 'Hey {name} 💼',    slide3: 'A new chapter begins! 💼',         slide5: 'Wishing you tremendous success\nin your new journey! ⭐', bgGradient: 'linear-gradient(160deg, rgba(20,120,130,0.55) 0%, rgba(5,25,30,0.6) 65%)', particleColor: '#8fe3d8' },
  newhome:     { cardTitle: 'Welcome to Your New Home! 🏠',  slide1: 'Hey {name} 🏠',    slide3: 'A new place to call home! 🏠',     slide5: 'Wishing you warmth and joy\nin your beautiful new home 🌟', bgGradient: 'linear-gradient(160deg, rgba(210,120,40,0.5) 0%, rgba(35,15,5,0.6) 65%)', particleColor: '#ffd9a0' },
  babyshower:  { cardTitle: 'Welcome Little One! 👶',        slide1: 'Hey {name} 🍼',    slide3: 'A new blessing arrives! 👶',       slide5: 'Wishing your family\njoy and love always 💕', bgGradient: 'linear-gradient(160deg, rgba(140,170,220,0.5) 0%, rgba(20,25,40,0.6) 65%)', particleColor: '#cfe0ff' },
  engagement:  { cardTitle: 'Congratulations! 💑',           slide1: 'Hey {name} 💑',    slide3: 'A beautiful journey begins! 💑',   slide5: 'Wishing you a lifetime\nof love and happiness together 💕', bgGradient: 'linear-gradient(160deg, rgba(212,160,90,0.5) 0%, rgba(35,20,10,0.6) 65%)', particleColor: '#f0d9b0' },
}

const DEFAULT_BG_GRADIENT = 'linear-gradient(160deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 65%)'
const DEFAULT_PARTICLE_COLOR = '#ffffff'

export function getOccasionConfig(type) {
  if (OCCASION_CONFIG[type]) return OCCASION_CONFIG[type]
  const label = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Special Moment'
  return {
    cardTitle: 'Congratulations! 🎉',
    slide1: 'Hey {name} 🎉',
    slide3: `Celebrating your ${label}! 🎊`,
    slide5: 'Wishing you all the best\nin this special moment 🥰',
    bgGradient: DEFAULT_BG_GRADIENT,
    particleColor: DEFAULT_PARTICLE_COLOR,
  }
}
