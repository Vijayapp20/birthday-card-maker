// SEO landing-page content per occasion. Kept separate from occasions.js
// (which drives in-app card styling) because this is copy for Google/crawlers,
// not runtime UI config — different concern, different lifecycle.

export const SEO_PAGES = {
  birthday: {
    path: '/birthday-wishes',
    title: 'Free Birthday Wishes Generator — Create an AI Birthday Card Online',
    metaDescription: 'Create free personalized birthday wishes online. Upload a photo, pick your relationship, and let AI write a heartfelt birthday message with animations and a shareable link.',
    h1: 'Free Birthday Wishes Generator',
    intro: `Looking for the perfect birthday wishes for someone special? Our free birthday wishes generator creates a personalized, animated birthday card in seconds. Just add the recipient's name, your relationship to them, and an optional photo — our AI writes a heartfelt, relationship-aware birthday message for you, or you can write your own. Every card comes with animations, music, and a shareable link you can send over WhatsApp, Instagram, or email.`,
    samples: [
      'Wishing you a day filled with love, laughter, and everything that makes you smile. Happy Birthday!',
      "Another year older, another year more amazing. Here's to celebrating you today!",
      'May this birthday bring you closer to all your dreams. Have a wonderful day!',
    ],
  },
  anniversary: {
    path: '/anniversary-wishes',
    title: 'Free Anniversary Wishes Generator — Create an AI Anniversary Card Online',
    metaDescription: 'Create free personalized anniversary wishes online. Celebrate love and years together with an AI-written message, photo, animations, and a shareable card link.',
    h1: 'Free Anniversary Wishes Generator',
    intro: `Celebrate love with free, personalized anniversary wishes. Our generator creates an animated anniversary card with a heartfelt AI-written message tailored to your relationship — whether it's for a spouse, parents, or friends celebrating their special day. Add a photo, choose a template, and share the card instantly with a link.`,
    samples: [
      'Here\'s to another year of love, laughter, and beautiful memories together. Happy Anniversary!',
      'Watching your love grow stronger every year is truly inspiring. Happy Anniversary to you both!',
    ],
  },
  graduation: {
    path: '/graduation-wishes',
    title: 'Free Graduation Wishes Generator — Create an AI Congratulations Card',
    metaDescription: 'Create free personalized graduation wishes online. Celebrate their achievement with an AI-written congratulations message, photo, animations, and a shareable card link.',
    h1: 'Free Graduation Wishes Generator',
    intro: `Congratulate a graduate with a free, personalized graduation card. Our AI writes a proud, encouraging message based on your relationship with the graduate, and you can add their photo, pick a celebration template, and share it instantly.`,
    samples: [
      "Congratulations on this incredible achievement! Your hard work has truly paid off — here's to your bright future.",
      'You did it! So proud of everything you\'ve accomplished. The best is yet to come!',
    ],
  },
  newjob: {
    path: '/new-job-wishes',
    title: 'Free New Job Wishes Generator — Create an AI Congratulations Card',
    metaDescription: 'Create free personalized new job wishes online. Congratulate them on their new role with an AI-written message, animations, and a shareable card link.',
    h1: 'Free New Job Wishes Generator',
    intro: `Celebrate someone's new job or career milestone with a free personalized card. Our AI generates a motivating, excited message for their new chapter, and you can add a photo and share the card with a single link.`,
    samples: [
      'Congratulations on the new role! Wishing you tremendous success in this exciting new journey.',
      'A new chapter begins! Your dedication and talent have led you here — go make it amazing.',
    ],
  },
  newhome: {
    path: '/new-home-wishes',
    title: 'Free New Home Wishes Generator — Create an AI Housewarming Card',
    metaDescription: 'Create free personalized new home wishes online. Welcome them to their new home with an AI-written message, animations, and a shareable card link.',
    h1: 'Free New Home Wishes Generator',
    intro: `Welcome someone to their new home with a free, personalized housewarming card. Our AI writes a warm, joyful message for their new beginning, complete with animations and a shareable link.`,
    samples: [
      'Wishing you warmth, joy, and countless happy memories in your beautiful new home!',
      'A new place to call home, a new chapter to begin. Congratulations on your new home!',
    ],
  },
  babyshower: {
    path: '/baby-shower-wishes',
    title: 'Free Baby Shower Wishes Generator — Create an AI Baby Shower Card',
    metaDescription: 'Create free personalized baby shower wishes online. Celebrate the new arrival with an AI-written message, animations, and a shareable card link.',
    h1: 'Free Baby Shower Wishes Generator',
    intro: `Celebrate a new little arrival with free, personalized baby shower wishes. Our AI writes a tender, joyful message for the parents-to-be, and you can add a photo and share the card instantly.`,
    samples: [
      'Wishing your family so much joy and love as you welcome your new little blessing!',
      'A new little one is on the way — congratulations on this beautiful new beginning!',
    ],
  },
  engagement: {
    path: '/engagement-wishes',
    title: 'Free Engagement Wishes Generator — Create an AI Congratulations Card',
    metaDescription: 'Create free personalized engagement wishes online. Celebrate the beginning of their journey together with an AI-written message, animations, and a shareable card link.',
    h1: 'Free Engagement Wishes Generator',
    intro: `Celebrate an engagement with a free, personalized card. Our AI writes a romantic, joyful message for the couple's new journey together, and you can add a photo and share it with one link.`,
    samples: [
      'Wishing you both a lifetime of love and happiness as you begin this beautiful journey together!',
      'A beautiful journey begins! Congratulations on your engagement.',
    ],
  },
}

export const SEO_PAGE_LIST = Object.entries(SEO_PAGES).map(([key, data]) => ({ key, ...data }))
