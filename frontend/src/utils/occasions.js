// Shared occasion-based content config used by BirthdayCard so the copy
// stays consistent and logic isn't duplicated.

export const OCCASION_CONFIG = {
  birthday:    { cardTitle: 'Happy Level Up Day! 🥳',       slide1: 'Hey {name} 🤭❤️',  slide3: "It's your special day! 🎂",       slide5: 'Wishing you a long life\nand good health always 🥰', particleColor: '#ffb3c6', vantaColors: { highlightColor: 0xff9eb1, midtoneColor: 0xff5c8a, lowlightColor: 0x2a0512, baseColor: 0x120309 } },
  anniversary: { cardTitle: 'Happy Anniversary! 💍',         slide1: 'Hey {name} 💕',    slide3: 'Celebrating your love! 💍',        slide5: 'Wishing you endless love\nand happiness together 🥰', particleColor: '#ffcad4', vantaColors: { highlightColor: 0xff6b81, midtoneColor: 0xc9184a, lowlightColor: 0x2b0a12, baseColor: 0x14040a } },
  graduation:  { cardTitle: 'Congratulations! 🎓',           slide1: 'Hey {name} 🎉',    slide3: 'You did it! 🎓',                   slide5: 'Wishing you great success\nin all your future endeavors! 🚀', particleColor: '#a8b8ff', vantaColors: { highlightColor: 0x8ea9ff, midtoneColor: 0x3a3aff, lowlightColor: 0x0a0a2b, baseColor: 0x05051a } },
  newjob:      { cardTitle: 'Congrats on the New Role! 🚀',  slide1: 'Hey {name} 💼',    slide3: 'A new chapter begins! 💼',         slide5: 'Wishing you tremendous success\nin your new journey! ⭐', particleColor: '#8fe3d8', vantaColors: { highlightColor: 0x7fe9d8, midtoneColor: 0x149aa0, lowlightColor: 0x03191c, baseColor: 0x02100f } },
  newhome:     { cardTitle: 'Welcome to Your New Home! 🏠',  slide1: 'Hey {name} 🏠',    slide3: 'A new place to call home! 🏠',     slide5: 'Wishing you warmth and joy\nin your beautiful new home 🌟', particleColor: '#ffd9a0', vantaColors: { highlightColor: 0xffcf8a, midtoneColor: 0xd97b2a, lowlightColor: 0x2a1505, baseColor: 0x180b03 } },
  babyshower:  { cardTitle: 'Welcome Little One! 👶',        slide1: 'Hey {name} 🍼',    slide3: 'A new blessing arrives! 👶',       slide5: 'Wishing your family\njoy and love always 💕', particleColor: '#cfe0ff', vantaColors: { highlightColor: 0xbcd4ff, midtoneColor: 0x6a9be0, lowlightColor: 0x0d1830, baseColor: 0x060d1a } },
  engagement:  { cardTitle: 'Congratulations! 💑',           slide1: 'Hey {name} 💑',    slide3: 'A beautiful journey begins! 💑',   slide5: 'Wishing you a lifetime\nof love and happiness together 💕', particleColor: '#f0d9b0', vantaColors: { highlightColor: 0xf0d2a0, midtoneColor: 0xd4a05a, lowlightColor: 0x2a1a08, baseColor: 0x160d04 } },
}

const DEFAULT_PARTICLE_COLOR = '#ffffff'
const DEFAULT_VANTA_COLORS = { highlightColor: 0xffb3c6, midtoneColor: 0xff6f91, lowlightColor: 0x1a0a12, baseColor: 0x0d0509 }

export function getOccasionConfig(type) {
  if (OCCASION_CONFIG[type]) return OCCASION_CONFIG[type]
  const label = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Special Moment'
  return {
    cardTitle: 'Congratulations! 🎉',
    slide1: 'Hey {name} 🎉',
    slide3: `Celebrating your ${label}! 🎊`,
    slide5: 'Wishing you all the best\nin this special moment 🥰',
    particleColor: DEFAULT_PARTICLE_COLOR,
    vantaColors: DEFAULT_VANTA_COLORS,
  }
}
