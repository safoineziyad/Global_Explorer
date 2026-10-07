// Curated landmark content. Slugs are stable and used by routes/sitemap.
//
// Localized copies of every user-visible string live in src/i18n/content.ts.
// The English text here is the reference wording; the data files hold the
// structural facts (codes, coordinates, list membership) that must not be
// localized, so this module stays a plain, importable data source.

import type { RecordConfidence, Source } from './sources'

export type LandmarkLocation = {
  lat: number
  lng: number
}

export type WonderListId = 'new-seven' | 'ancient-seven' | 'natural-highlights'

/**
 * Describes what each wonder list actually is, so the UI never implies a
 * curated selection is a complete or official canon.
 */
export type WonderListMeta = {
  id: WonderListId
  labelKey: string
  /** True only for lists that are themselves an official, complete canon. */
  official: boolean
  /** True only when the list is meant to be exhaustive. */
  complete: boolean
  /** Explains the scope/caveat, shown verbatim under the list heading. */
  noteKey: string
}

export const WONDER_LIST_META: Record<WonderListId, WonderListMeta> = {
  'new-seven': {
    id: 'new-seven',
    labelKey: 'site.newSeven',
    official: true,
    complete: true,
    noteKey: 'wonder.note.newSeven',
  },
  'ancient-seven': {
    id: 'ancient-seven',
    labelKey: 'site.ancientWonders',
    official: false,
    complete: true,
    noteKey: 'wonder.note.ancientSeven',
  },
  'natural-highlights': {
    id: 'natural-highlights',
    labelKey: 'site.naturalHighlights',
    official: false,
    complete: false,
    noteKey: 'wonder.note.naturalHighlights',
  },
}

/** The canonical Seven Wonders of the Ancient World, attributed to Antipater of Sidon. */
export const ANCIENT_SEVEN_SLUGS = [
  'pyramids',
  'hanging-gardens-of-babylon',
  'statue-of-zeus',
  'temple-of-artemis',
  'mausoleum-at-halicarnassus',
  'colossus-of-rhodes',
  'lighthouse-of-alexandria',
] as const

export const NEW_SEVEN_SLUGS = [
  'christ-redeemer',
  'colosseum',
  'great-wall',
  'machu-picchu',
  'petra',
  'taj-mahal',
  'chichen-itza',
] as const

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
  /** Whether the structure still stands. Ancient wonders other than the Pyramids do not. */
  status?: 'extant' | 'lost'
  /** How firmly the record can be stated as fact; drives qualified wording. */
  confidence?: RecordConfidence
  /** Where this record's coordinates and dating come from. */
  sources?: Source[]
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
    sources: [
      {
        label: 'UNESCO World Heritage Centre — Sagarmatha National Park',
        url: 'https://whc.unesco.org/en/list/120/',
        checked: '2026-10-04',
      },
    ],
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
    sources: [
      {
        label: "UNESCO World Heritage Centre — Historic Sanctuary of Machu Picchu",
        url: "https://whc.unesco.org/en/list/274/",
        checked: '2026-10-04',
      },
    ],
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
    sources: [
      {
        label: "UNESCO World Heritage Centre — The Great Wall",
        url: "https://whc.unesco.org/en/list/438/",
        checked: '2026-10-04',
      },
    ],
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
    sources: [
      {
        label: "UNESCO World Heritage Centre — Petra",
        url: "https://whc.unesco.org/en/list/326/",
        checked: '2026-10-04',
      },
    ],
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
    sources: [
      {
        label: "UNESCO World Heritage Centre — Taj Mahal",
        url: "https://whc.unesco.org/en/list/252/",
        checked: '2026-10-04',
      },
    ],
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
    sources: [
      {
        label: "UNESCO World Heritage Centre — Historic Centre of Rome",
        url: "https://whc.unesco.org/en/list/91/",
        checked: '2026-10-04',
      },
    ],
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
    status: 'extant',
    confidence: 'verified',
    sources: [
      {
        label: 'UNESCO World Heritage Centre — Memphis and its Necropolis',
        url: 'https://whc.unesco.org/en/list/86/',
        checked: '2026-10-04',
      },
    ],
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
    sources: [
      {
        label: 'UNESCO World Heritage Centre — Rio de Janeiro: Carioca Landscapes between the Mountain and the Sea',
        url: 'https://whc.unesco.org/en/list/1100/',
        checked: '2026-10-04',
      },
    ],
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
    sources: [
      {
        label: "UNESCO World Heritage Centre — Angkor",
        url: "https://whc.unesco.org/en/list/668/",
        checked: '2026-10-04',
      },
    ],
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
    sources: [
      {
        label: "UNESCO World Heritage Centre — Stonehenge, Avebury and Associated Sites",
        url: "https://whc.unesco.org/en/list/373/",
        checked: '2026-10-04',
      },
    ],
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
    sources: [
      {
        label: "UNESCO World Heritage Centre — Acropolis, Athens",
        url: "https://whc.unesco.org/en/list/404/",
        checked: '2026-10-04',
      },
    ],
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
    sources: [
      {
        label: "UNESCO World Heritage Centre — Pre-Hispanic City of Chichen-Itza",
        url: "https://whc.unesco.org/en/list/483/",
        checked: '2026-10-04',
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* The Seven Wonders of the Ancient World                              */
  /* Only the Pyramids of Giza survive. The other six are described from   */
  /* ancient literary sources; nothing of them remains standing, and in    */
  /* one case (the Hanging Gardens) even the location is unconfirmed.      */
  /* ------------------------------------------------------------------ */

  {
    slug: 'hanging-gardens-of-babylon',
    name: 'Hanging Gardens of Babylon',
    country: 'IRQ',
    location: { lat: 32.5355, lng: 44.4275 },
    type: 'Terraced garden complex',
    built: 'Attributed to Nebuchadnezzar II, 6th century BCE',
    period: 'Neo-Babylonian Empire',
    description:
      'The Hanging Gardens of Babylon are described by Greek writers as a series of irrigated terraces planted with trees and rising in stepped levels above the city. No archaeological trace of them has been found, and leading historians continue to dispute whether they existed at all.',
    facts: [
      'They are attributed to King Nebuchadnezzar II, who reigned from 605 to 562 BCE.',
      'The account comes from later Greek writers, including Diodorus Siculus and Strabo, not Babylonian records.',
      'No remains have been identified; the proposed location near Babylon in modern Iraq remains unconfirmed.',
      'Some scholars argue the description may derive from a different structure or be a later literary invention.',
    ],
    unesco: false,
    wonderLists: ['ancient-seven'],
    status: 'lost',
    confidence: 'disputed',
    sources: [
      {
        label: 'Encyclopaedia Britannica — Hanging Gardens of Babylon',
        url: 'https://www.britannica.com/topic/Hanging-Gardens-of-Babylon',
        checked: '2026-10-04',
      },
      {
        label: 'World History Encyclopedia — Hanging Gardens of Babylon',
        url: 'https://www.worldhistory.org/Hanging_Gardens_of_Babylon/',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'statue-of-zeus',
    name: 'Statue of Zeus at Olympia',
    country: 'GRC',
    location: { lat: 37.638, lng: 21.63 },
    type: 'Colossal cult statue',
    built: 'c. 435 BCE',
    height: 'Reportedly about 12 m (40 ft)',
    period: 'Classical Greece',
    description:
      'The Statue of Zeus at Olympia was a chryselephantine figure of the god seated in a throne, made by the sculptor Phidias inside the Temple of Zeus. It was one of the most celebrated works of ancient sculpture and is known chiefly through the description of the travel writer Pausanias.',
    facts: [
      'It was made by Phidias, who also sculpted the Athena Parthenos at Athens.',
      'It was built from gold and ivory over a wooden core.',
      'Pausanias described it in his second-century CE account of Greece.',
      'The original was destroyed by fire at Olympia in 476 CE; a Roman-era replacement statue stood in its place.',
    ],
    unesco: false,
    wonderLists: ['ancient-seven'],
    status: 'lost',
    confidence: 'attested',
    sources: [
      {
        label: 'Perseus Digital Library — Pausanias, Description of Greece, Book 5',
        url: 'https://www.perseus.tufts.edu/hopper/text?doc=Paus.%205.11',
        checked: '2026-10-04',
      },
      {
        label: 'Archaeological Museum of Olympia',
        url: 'https://www.culture.gov.gr/',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'temple-of-artemis',
    name: 'Temple of Artemis at Ephesus',
    country: 'TUR',
    location: { lat: 37.9208, lng: 27.3403 },
    type: 'Temple',
    built: 'Original c. 550 BCE; rebuilt in the Hellenistic period',
    height: 'Reportedly about 115 m (377 ft) including the columns',
    period: 'Archaic Greek to Hellenistic',
    description:
      'The Temple of Artemis at Ephesus, near Selçuk in modern Türkiye, was a vast sanctuary to the goddess Artemis that was rebuilt several times and destroyed in antiquity. Its excavated foundations remain one of the most important ancient sanctuaries in the region.',
    facts: [
      'It was dedicated to Artemis and served as one of the major cult centres of the ancient Mediterranean.',
      'The temple was rebuilt after an arson in 356 BCE, reputedly on the same night Alexander the Great was born.',
      'It was destroyed in the early 5th century CE; later accounts dispute the cause.',
      'The site itself is today part of the UNESCO-listed ancient city of Ephesus, about 3 km away.',
    ],
    unesco: false,
    wonderLists: ['ancient-seven'],
    status: 'lost',
    confidence: 'attested',
    sources: [
      {
        label: 'UNESCO World Heritage Centre — Ephesus',
        url: 'https://whc.unesco.org/en/list/1518/',
        checked: '2026-10-04',
      },
      {
        label: 'Encyclopaedia Britannica — Temple of Artemis',
        url: 'https://www.britannica.com/topic/Temple-of-Artemis-at-Ephesus',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'mausoleum-at-halicarnassus',
    name: 'Mausoleum at Halicarnassus',
    country: 'TUR',
    location: { lat: 37.0303, lng: 27.4315 },
    type: 'Tomb monument',
    built: 'c. 353–350 BCE',
    height: 'Reportedly about 45 m (148 ft)',
    period: 'Classical Greek / early Hellenistic',
    description:
      'The Mausoleum at Halicarnassus was the tomb of King Mausolus, built by his widow Artemisia II in the 4th century BCE. It gave its name to the word mausoleum, and a reconstruction survives in the remains kept inside the Castle of St Peter in Bodrum.',
    facts: [
      'It was built for Mausolus, satrap of Caria, and completed by his widow and sister Artemisia II.',
      'The name "mausoleum" derives from this building.',
      'Sculptors including Scopas and Praxiteles are associated with its decoration.',
      'It was damaged by earthquakes and dismantled in the medieval period; surviving fragments are displayed in Bodrum.',
    ],
    unesco: false,
    wonderLists: ['ancient-seven'],
    status: 'lost',
    confidence: 'attested',
    sources: [
      {
        label: 'Museum of Underwater Archaeology, Bodrum Castle',
        url: 'https://www.ktb.gov.tr/',
        checked: '2026-10-04',
      },
      {
        label: 'Encyclopaedia Britannica — Mausoleum of Halicarnassus',
        url: 'https://www.britannica.com/topic/Mausoleum-of-Halicarnassus',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'colossus-of-rhodes',
    name: 'Colossus of Rhodes',
    country: 'GRC',
    location: { lat: 36.4511, lng: 28.2277 },
    type: 'Colossal bronze statue',
    built: 'c. 292–280 BCE',
    height: 'Reportedly about 33 m (108 ft)',
    period: 'Hellenistic',
    description:
      'The Colossus of Rhodes was a bronze statue of the sun god Helios, erected at the entrance to the harbour of Rhodes by the sculptor Chares of Lindos. It stood only a few decades before being toppled by an earthquake, and was later dismantled.',
    facts: [
      'It was built by Chares of Lindos, who was a pupil of Lysippos.',
      'Accounts describe it as standing at the harbour entrance beside the famous statues at the mole.',
      'It was knocked down by an earthquake in the 2nd century BCE, commonly dated to 226 BCE.',
      'It was removed in the 2nd century CE, probably by the Romans; the site is now the Mandraki harbour area.',
    ],
    unesco: false,
    wonderLists: ['ancient-seven'],
    status: 'lost',
    confidence: 'attested',
    sources: [
      {
        label: 'Perseus Digital Library — Pliny the Elder, Natural History, Book 34',
        url: 'https://www.perseus.tufts.edu/hopper/text?doc=Plin.%20NH.%2034.41',
        checked: '2026-10-04',
      },
      {
        label: 'Encyclopaedia Britannica — Colossus of Rhodes',
        url: 'https://www.britannica.com/topic/Colossus-of-Rhodes',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'lighthouse-of-alexandria',
    name: 'Lighthouse of Alexandria',
    country: 'EGY',
    location: { lat: 31.2017, lng: 29.9187 },
    type: 'Lighthouse',
    built: 'c. 280 BCE',
    height: 'Estimated roughly 100 m (about 328 ft) in its final phase',
    period: 'Ptolemaic Egypt',
    description:
      'The Lighthouse of Alexandria, or Pharos, was a tiered tower built on the island of Pharos off the Egyptian coast under Ptolemy II. Guided by the architect Sostratus, it stood in three diminishing sections and served ships for many centuries before collapsing.',
    facts: [
      'It was built during the reign of Ptolemy II Philadelphus, generally dated to about 280 BCE.',
      'It stood on the island of Pharos, which gave the island and the lighthouse its name.',
      'A Roman-era lighthouse stood there after the original fell, and it was destroyed in the medieval period.',
      'The fortress of the Qaitbay Citadel, built in the 15th century, stands on part of the site.',
    ],
    unesco: false,
    wonderLists: ['ancient-seven'],
    status: 'lost',
    confidence: 'attested',
    sources: [
      {
        label: 'Encyclopaedia Britannica — Lighthouse of Alexandria',
        url: 'https://www.britannica.com/topic/Lighthouse-of-Alexandria',
        checked: '2026-10-04',
      },
      {
        label: 'Qaitbay Citadel, Alexandria (Sultan Qaitbay documentation)',
        url: 'https://whc.unesco.org/en/tentativelists/5865/',
        checked: '2026-10-04',
      },
    ],
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
