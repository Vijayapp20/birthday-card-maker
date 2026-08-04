// Shared occasion-based content config — used by BOTH Template 1 (BirthdayCard)
// and Template 2 (LetterCard) so the copy stays consistent and logic isn't duplicated.

export const OCCASION_CONFIG = {
  birthday:    { cardTitle: 'Happy Level Up Day! 🥳',       slide1: 'Hey {name} 🤭❤️',  slide3: "It's your special day! 🎂",       slide5: 'Wishing you a long life\nand good health always 🥰' },
  anniversary: { cardTitle: 'Happy Anniversary! 💍',         slide1: 'Hey {name} 💕',    slide3: 'Celebrating your love! 💍',        slide5: 'Wishing you endless love\nand happiness together 🥰' },
  graduation:  { cardTitle: 'Congratulations! 🎓',           slide1: 'Hey {name} 🎉',    slide3: 'You did it! 🎓',                   slide5: 'Wishing you great success\nin all your future endeavors! 🚀' },
  newjob:      { cardTitle: 'Congrats on the New Role! 🚀',  slide1: 'Hey {name} 💼',    slide3: 'A new chapter begins! 💼',         slide5: 'Wishing you tremendous success\nin your new journey! ⭐' },
  newhome:     { cardTitle: 'Welcome to Your New Home! 🏠',  slide1: 'Hey {name} 🏠',    slide3: 'A new place to call home! 🏠',     slide5: 'Wishing you warmth and joy\nin your beautiful new home 🌟' },
  babyshower:  { cardTitle: 'Welcome Little One! 👶',        slide1: 'Hey {name} 🍼',    slide3: 'A new blessing arrives! 👶',       slide5: 'Wishing your family\njoy and love always 💕' },
  engagement:  { cardTitle: 'Congratulations! 💑',           slide1: 'Hey {name} 💑',    slide3: 'A beautiful journey begins! 💑',   slide5: 'Wishing you a lifetime\nof love and happiness together 💕' },
}

export function getOccasionConfig(type) {
  if (OCCASION_CONFIG[type]) return OCCASION_CONFIG[type]
  const label = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Special Moment'
  return {
    cardTitle: 'Congratulations! 🎉',
    slide1: 'Hey {name} 🎉',
    slide3: `Celebrating your ${label}! 🎊`,
    slide5: 'Wishing you all the best\nin this special moment 🥰',
  }
}
