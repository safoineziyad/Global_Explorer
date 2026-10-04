// Curated landmark content. Slugs are stable and used by routes/sitemap.

export type LandmarkLocation = {
  lat: number
  lng: number
}

export type WonderListId = 'new-seven' | 'ancient-seven' | 'natural-highlights'

export type Landmark = {
  slug: string
  name: string
  country: string // ISO 3166-1 alpha-3
  location: LandmarkLocation
  type: string
  built: string
  height?: string
  period: string
  description: string
  facts: string[]
  bestTime?: string
  unesco: boolean
  wonderLists?: WonderListId[]
}

export const landmarks: Landmark[] = [
  {
    slug: 'everest',
    name: 'Mount Everest',
    country: 'NPL',
    location: { lat: 27.9881, lng: 86.925 },
    type: 'Mountain',
    built: 'Natural formation',
    height: '8,848.86 m',
    period: 'Formed over millions of years',
    description:
      'Mount Everest is Earth\u2019s highest peak above sea level, rising from the Himalayas on the border of Nepal and China. It is the ultimate mountaineering challenge and a sacred landscape for local Sherpa communities.',
    facts: [
      'Its height was most recently measured at 8,848.86 metres in 2020.',
      'The first confirmed ascent was by Edmund Hillary and Tenzing Norgay in 1953.',
      'The summit sits on the border between Nepal and Tibet.',
      'The mountain is known as Sagarmatha in Nepali and Chomolungma in Tibetan.',
    ],
    bestTime: 'April to May, and September to October',
    unesco: true,
    wonderLists: ['natural-highlights'],
  },
  {
    slug: 'machu-picchu',
    name: 'Machu Picchu',
    country: 'PER',
    location: { lat: -13.1631, lng: -72.545 },
    type: 'Ancient city',
    built: 'c. 1450 CE',
    height: '2,430 m above sea level',
    period: 'Inca Empire',
    description:
      'Machu Picchu is a 15th-century Inca citadel perched on a mountain ridge above the Sacred Valley. Its dry-stone walls, terraces and temples showcase remarkable Inca engineering.',
    facts: [
      'It was built at the height of the Inca Empire for the emperor Pachacuti.',
      'The site was never discovered by Spanish conquistadors.',
      'It was brought to international attention by Hiram Bingham in 1911.',
      'The stonework uses no mortar, with blocks fitted so tightly that a blade can barely pass between them.',
    ],
    bestTime: 'May to September (dry season)',
    unesco: true,
    wonderLists: ['new-seven'],
  },
  {
    slug: 'great-wall',
    name: 'Great Wall of China',
    country: 'CHN',
    location: { lat: 40.4319, lng: 116.5704 },
    type: 'Fortification',
    built: '7th century BCE onward',
    height: 'Up to 8 m',
    period: 'Multiple dynasties',
    description:
      'The Great Wall is a vast network of fortifications stretching thousands of kilometres across northern China. Sections were built and rebuilt over many dynasties to defend against invasions.',
    facts: [
      'It is not a single wall but many interconnected walls and branches.',
      'The most famous sections near Beijing were built during the Ming dynasty.',
      'Estimates of its total length exceed 21,000 kilometres.',
      'Watchtowers allowed soldiers to signal warnings with smoke and fire.',
    ],
    bestTime: 'April to May and September to October',
    unesco: true,
    wonderLists: ['new-seven'],
  },
  {
    slug: 'petra',
    name: 'Petra',
    country: 'JOR',
    location: { lat: 30.3285, lng: 35.4444 },
    type: 'Rock-cut architecture',
    built: 'c. 312 BCE',
    height: 'Al-Khazneh facade about 39 m',
    period: 'Nabataean Kingdom',
    description:
      'Petra is an ancient city carved directly into rose-red sandstone cliffs. Once the capital of the Nabataeans, it was a thriving trading hub on routes between Arabia and the Mediterranean.',
    facts: [
      'Its buildings are carved into rock rather than constructed.',
      'The Treasury, or Al-Khazneh, is its most iconic facade.',
      'An ingenious system of channels supplied the desert city with water.',
      'It was largely forgotten by the West until the 19th century.',
    ],
    bestTime: 'March to May and September to November',
    unesco: true,
    wonderLists: ['new-seven'],
  },
  {
    slug: 'taj-mahal',
    name: 'Taj Mahal',
    country: 'IND',
    location: { lat: 27.1751, lng: 78.0421 },
    type: 'Mausoleum',
    built: '1632\u20131653 CE',
    height: '73 m',
    period: 'Mughal Empire',
    description:
      'The Taj Mahal is a white marble mausoleum built by Emperor Shah Jahan in memory of his wife Mumtaz Mahal. Its symmetry, gardens and inlaid stonework make it a masterpiece of Mughal architecture.',
    facts: [
      'It took roughly 20,000 artisans and over 20 years to complete.',
      'The marble changes appearance with the shifting light of day.',
      'It is flanked by a mosque and a guest house for symmetry.',
      'Semi-precious stones are inlaid into the marble in floral patterns.',
    ],
    bestTime: 'October to March',
    unesco: true,
    wonderLists: ['new-seven'],
  },
  {
    slug: 'colosseum',
    name: 'Colosseum',
    country: 'ITA',
    location: { lat: 41.8902, lng: 12.4922 },
    type: 'Amphitheatre',
    built: '70\u201380 CE',
    height: '48 m',
    period: 'Roman Empire',
    description:
      'The Colosseum is the largest amphitheatre ever built, an engineering marvel of ancient Rome where gladiatorial contests and public spectacles were staged for crowds of tens of thousands.',
    facts: [
      'It could hold an estimated 50,000 to 80,000 spectators.',
      'A retractable awning called the velarium shaded the audience.',
      'Underground passages, known as the hypogeum, housed gladiators and animals.',
      'It remained in use for around 500 years.',
    ],
    bestTime: 'April to June and September to October',
    unesco: true,
    wonderLists: ['new-seven'],
  },
  {
    slug: 'pyramids',
    name: 'Pyramids of Giza',
    country: 'EGY',
    location: { lat: 29.9792, lng: 31.1342 },
    type: 'Monument',
    built: 'c. 2560 BCE',
    height: 'Great Pyramid originally 146.6 m',
    period: 'Ancient Egypt',
    description:
      'The Pyramids of Giza are among the oldest surviving wonders of the ancient world. The Great Pyramid was built as a tomb for the pharaoh Khufu and remains a symbol of Egyptian civilisation.',
    facts: [
      'The Great Pyramid was the tallest human-made structure for over 3,800 years.',
      'The nearby Great Sphinx is carved from a single limestone outcrop.',
      'Millions of stone blocks were moved and fitted with astonishing precision.',
      'They are aligned closely with the cardinal directions.',
    ],
    bestTime: 'October to April',
    unesco: true,
    wonderLists: ['ancient-seven'],
  },
  {
    slug: 'christ-redeemer',
    name: 'Christ the Redeemer',
    country: 'BRA',
    location: { lat: -22.9519, lng: -43.2105 },
    type: 'Statue',
    built: '1922\u20131931 CE',
    height: '30 m, 38 m with pedestal',
    period: 'Modern era',
    description:
      'Christ the Redeemer is an Art Deco statue of Jesus Christ overlooking Rio de Janeiro from the peak of Corcovado mountain. It has become an iconic symbol of Brazil and of welcome.',
    facts: [
      'It is made of reinforced concrete and covered in soapstone tiles.',
      'The arms stretch about 28 metres wide.',
      'It sits 710 metres above the city.',
      'It is illuminated at night and frequently struck by lightning.',
    ],
    bestTime: 'May to October',
    unesco: false,
    wonderLists: ['new-seven'],
  },
  {
    slug: 'angkor-wat',
    name: 'Angkor Wat',
    country: 'KHM',
    location: { lat: 13.4125, lng: 103.867 },
    type: 'Temple complex',
    built: 'c. 1113\u20131150 CE',
    height: 'Central tower about 65 m',
    period: 'Khmer Empire',
    description:
      'Angkor Wat is the largest religious monument in the world, built by King Suryavarman II as a Hindu temple and later used as a Buddhist site. Its galleries are covered in intricate bas-reliefs.',
    facts: [
      'It is the largest religious structure on Earth by land area.',
      'It appears on the national flag of Cambodia.',
      'The temple is oriented to the west, unlike most Khmer temples.',
      'Its moat and walls helped protect it from the jungle over centuries.',
    ],
    bestTime: 'November to March',
    unesco: true,
  },
  {
    slug: 'stonehenge',
    name: 'Stonehenge',
    country: 'GBR',
    location: { lat: 51.1789, lng: -1.8262 },
    type: 'Prehistoric monument',
    built: 'c. 3000\u20132000 BCE',
    height: 'Tallest stones about 7 m',
    period: 'Neolithic and Bronze Age',
    description:
      'Stonehenge is a prehistoric circle of massive standing stones on Salisbury Plain. Its exact purpose remains debated, but it was clearly aligned with the movements of the sun.',
    facts: [
      'The largest sarsen stones weigh around 25 tonnes each.',
      'Some smaller bluestones were transported from Wales.',
      'The monument is aligned with the summer and winter solstices.',
      'It was built and altered over roughly 1,500 years.',
    ],
    bestTime: 'May to September',
    unesco: true,
  },
  {
    slug: 'acropolis',
    name: 'Acropolis of Athens',
    country: 'GRC',
    location: { lat: 37.9715, lng: 23.7257 },
    type: 'Citadel',
    built: '5th century BCE',
    height: '156 m above sea level',
    period: 'Classical Greece',
    description:
      'The Acropolis is a rocky citadel above Athens crowned by the Parthenon. It represents the high point of classical Greek architecture, art and democracy.',
    facts: [
      'The Parthenon was dedicated to the goddess Athena.',
      'It was built in just under a decade in the 5th century BCE.',
      'The buildings use subtle optical refinements instead of perfectly straight lines.',
      'It has served as a temple, church, mosque and fortress over its history.',
    ],
    bestTime: 'April to June and September to October',
    unesco: true,
  },
  {
    slug: 'chichen-itza',
    name: 'Chichén Itzá',
    country: 'MEX',
    location: { lat: 20.6843, lng: -88.5678 },
    type: 'Archaeological site',
    built: 'c. 600\u20131200 CE',
    height: 'El Castillo about 30 m',
    period: 'Maya civilisation',
    description:
      'Chichén Itzá is a large Maya city notable for the pyramid of El Castillo, the Great Ball Court and the sacred cenote. It blends Maya and Toltec architectural styles.',
    facts: [
      'El Castillo has 365 steps, matching the days of the solar year.',
      'At the equinoxes, shadow creates the appearance of a serpent descending.',
      'Its Great Ball Court is the largest in Mesoamerica.',
      'The site takes its name from a sacred sinkhole, or cenote.',
    ],
    bestTime: 'November to March',
    unesco: true,
    wonderLists: ['new-seven'],
  },
]

export const landmarksBySlug: Record<string, Landmark> = Object.fromEntries(
  landmarks.map((landmark) => [landmark.slug, landmark])
)

export function findLandmark(slug: string | undefined | null): Landmark | undefined {
  if (!slug) return undefined
  return landmarksBySlug[slug]
}

export function landmarksByCountry(cca3: string): Landmark[] {
  return landmarks.filter((landmark) => landmark.country === cca3.toUpperCase())
}
