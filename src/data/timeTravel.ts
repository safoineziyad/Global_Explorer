// Additive "Time Travel" feature data.
//
// The six headline cities carry hand-written placeholder content; every other
// place falls back to a deterministic generator so any place page can render a
// Time Travel section. Clearly mock — structured for a future API.

export type EraId = 'ancient' | 'medieval' | 'industrial' | 'recent' | 'current'

export type EraInfo = {
  existed: string
  happened: string
  changed: string
  connected: string[]
  influence: string
}

export type ImpactLink = {
  emoji: string
  label: string
  link?: string
}

export type HistoricalPlace = {
  slug: string
  name: string
  cca3: string
  lat: number
  lng: number
  founded: string
  /** Earliest year the place is considered active (negative = BCE). */
  activeFrom: number
  /** Latest year still active; 2026 means it exists today. */
  activeTo: number
  eras: Partial<Record<EraId, EraInfo>>
  dna: { geography: string; history: string; culture: string }
  impactChain: ImpactLink[]
  flow: string[]
}

export type EraOption = {
  id: EraId
  year: number
  labelKey: string
}

/** Five Time Machine stops, newest first. */
export const ERAS: EraOption[] = [
  { id: 'current', year: 2026, labelKey: 'timeMachine.era.current' },
  { id: 'recent', year: 1950, labelKey: 'timeMachine.era.recent' },
  { id: 'industrial', year: 1800, labelKey: 'timeMachine.era.industrial' },
  { id: 'medieval', year: 1200, labelKey: 'timeMachine.era.medieval' },
  { id: 'ancient', year: -500, labelKey: 'timeMachine.era.ancient' },
]

/** Horizontal timeline used on the Time Travel page. */
export const TIMELINE_YEARS = [1100, 1200, 1300, 1400, 1500, 1600, 2026]

export function yearToEra(year: number): EraId {
  if (year >= 2000) return 'current'
  if (year >= 1750) return 'industrial'
  if (year >= 500) return 'medieval'
  return 'ancient'
}

export function eraFor(year: number): EraInfo {
  const id = yearToEra(year)
  const base = ERAS.find((e) => e.id === id) ?? ERAS[0]
  return {
    existed: `Settlement layers from around ${base.year}.`,
    happened: `A period of change recorded around ${base.year}.`,
    changed: `Trade, borders and daily life shifted during this era.`,
    connected: ['Neighbouring regions', 'Trade routes', 'Coastal ports'],
    influence: `Ideas from this era travelled far beyond the region.`,
  }
}

const PLACES: HistoricalPlace[] = [
  {
    slug: 'marrakech',
    name: 'Marrakech',
    cca3: 'MAR',
    lat: 31.6295,
    lng: -7.9811,
    founded: '1070 CE',
    activeFrom: 1070,
    activeTo: 2026,
    eras: {
      medieval: {
        existed: 'A fortified Almoravid capital beside the Atlas passes.',
        happened: 'Caravans linked the Sahara to the Mediterranean markets.',
        changed: 'Walls, souks and gardens shaped a new urban culture.',
        connected: ['Timbuktu', 'Fez', 'Algiers', 'Atlas passes'],
        influence: 'Linked Saharan gold and salt to European and Arab trade.',
      },
      industrial: {
        existed: 'A regional capital of craft and commerce.',
        happened: 'Trade routes shifted toward the Atlantic coast.',
        changed: 'Artisan quarters adapted to new export markets.',
        connected: ['Casablanca', 'Tangier', 'Marseille'],
        influence: 'Its crafts and cuisine became a bridge to Europe.',
      },
      current: {
        existed: 'A living medina and a global travel destination.',
        happened: 'Its squares and gardens became world-famous.',
        changed: 'Conservation and tourism reshaped the old city.',
        connected: ['Africa', 'Europe', 'The wider world'],
        influence: 'A symbol of Moroccan heritage reaching a global audience.',
      },
      ancient: {
        existed: 'Sparse settlements along the desert edge.',
        happened: 'Amazigh communities moved with the seasons.',
        changed: 'Oases anchored early trade and farming.',
        connected: ['Sahara', 'Atlas valleys'],
        influence: 'Laid the foundations for later caravan cities.',
      },
    },
    dna: {
      geography: 'Between the Sahara, the Atlantic and the Mediterranean.',
      history: 'Almoravid capital and a caravan crossroads.',
      culture: 'Souks, gardens, music and cuisine born of many influences.',
    },
    impactChain: [
      { emoji: '🐪', label: 'Trans-Saharan Trade', link: 'Timbuktu' },
      { emoji: '🏛️', label: 'Almoravid History', link: 'North Africa' },
      { emoji: '🌍', label: 'Geographic Position', link: 'Sahara / Atlantic / Mediterranean' },
      { emoji: '🕌', label: 'Cultural Exchange', link: 'Other regions' },
    ],
    flow: ['Geography', 'Caravan routes', 'Trade', 'Migration', 'Cultural exchange', 'Modern world'],
  },
  {
    slug: 'rome',
    name: 'Rome',
    cca3: 'ITA',
    lat: 41.9028,
    lng: 12.4964,
    founded: '753 BCE (traditionally)',
    activeFrom: -753,
    activeTo: 2026,
    eras: {
      ancient: {
        existed: 'A republic and then an empire centred on the Forum.',
        happened: 'Roads, law and aqueducts spread across three continents.',
        changed: 'Concrete, arches and governance reshaped cities.',
        connected: ['Carthage', 'Athens', 'Alexandria', 'Gaul'],
        influence: 'Roman law and language still underpin much of the world.',
      },
      medieval: {
        existed: 'A papal city amid the ruins of empire.',
        happened: 'Pilgrimage and the Church reshaped the city.',
        changed: 'Old monuments became fortresses and churches.',
        connected: ['Byzantium', 'Santiago', 'Jerusalem'],
        influence: 'A spiritual capital that preserved classical learning.',
      },
      current: {
        existed: 'A capital layered with three thousand years of history.',
        happened: 'Restoration opened its monuments to millions.',
        changed: 'Ancient and modern coexist street by street.',
        connected: ['The world'],
        influence: 'A living museum that shaped Western architecture.',
      },
    },
    dna: {
      geography: 'A river crossing at the centre of the Italian peninsula.',
      history: 'Republic, empire, papacy and modern nation.',
      culture: 'Law, engineering, art and cuisine with global reach.',
    },
    impactChain: [
      { emoji: '🏛️', label: 'Roman Law → Modern legal systems' },
      { emoji: '🛣️', label: 'Roads → Trade and communication' },
      { emoji: '🗣️', label: 'Latin → European languages' },
      { emoji: '⛪', label: 'Church → Cultural continuity' },
    ],
    flow: ['Geography', 'River crossing', 'City-state', 'Empire', 'Law and language', 'Modern world'],
  },
  {
    slug: 'cairo',
    name: 'Cairo',
    cca3: 'EGY',
    lat: 30.0444,
    lng: 31.2357,
    founded: '969 CE',
    activeFrom: 969,
    activeTo: 2026,
    eras: {
      medieval: {
        existed: 'A Fatimid capital on the Nile beside older Memphis and Giza.',
        happened: 'Al-Azhar and the bazaars made it a centre of learning.',
        changed: 'Walls, mosques and a canal shaped a great metropolis.',
        connected: ['Alexandria', 'Damascus', 'Mecca', 'Timbuktu'],
        influence: 'A hub of scholarship linking Africa, Arabia and Europe.',
      },
      industrial: {
        existed: 'A key city of the Ottoman and later modern Egyptian state.',
        happened: 'The Suez Canal reframed its place in world trade.',
        changed: 'Railways and a new downtown grew beside the old city.',
        connected: ['Suez', 'Istanbul', 'London'],
        influence: 'Became a gateway between the Mediterranean and the Red Sea.',
      },
      current: {
        existed: 'One of the largest cities in Africa and the Arab world.',
        happened: 'It became a political and cultural capital of the region.',
        changed: 'New districts and a metro expanded far beyond the old walls.',
        connected: ['The world'],
        influence: 'Its media and universities shape opinion across the region.',
      },
    },
    dna: {
      geography: 'At the head of the Nile delta, near two continents.',
      history: 'Pharaonic, Islamic and modern layers on one river.',
      culture: 'Scholarship, printing, film and music.',
    },
    impactChain: [
      { emoji: '🌊', label: 'Nile → Agriculture and cities' },
      { emoji: '📚', label: 'Al-Azhar → Scholarship' },
      { emoji: '⛵', label: 'Suez Canal → Global shipping' },
      { emoji: '🎬', label: 'Culture → Regional influence' },
    ],
    flow: ['Geography', 'The Nile', 'Trade', 'Scholarship', 'Suez Canal', 'Modern world'],
  },
  {
    slug: 'baghdad',
    name: 'Baghdad',
    cca3: 'IRQ',
    lat: 33.3152,
    lng: 44.3661,
    founded: '762 CE',
    activeFrom: 762,
    activeTo: 2026,
    eras: {
      medieval: {
        existed: 'The round city founded as the Abbasid capital.',
        happened: 'The House of Wisdom translated Greek, Persian and Indian works.',
        changed: 'Paper, algebra and astronomy advanced rapidly.',
        connected: ['Damascus', 'Samarkand', 'Cairo', 'Constantinople'],
        influence: 'Preserved and extended knowledge that reached Europe.',
      },
      industrial: {
        existed: 'An Ottoman provincial capital on the Tigris.',
        happened: 'Trade and pilgrimage kept the river city alive.',
        changed: 'New quarters grew along the riverbanks.',
        connected: ['Basra', 'Istanbul', 'Aleppo'],
        influence: 'A meeting point on routes between East and West.',
      },
      current: {
        existed: 'A large modern capital with a deep literary tradition.',
        happened: 'It remains a cultural centre of the Arab world.',
        changed: 'Museums and universities rebuilt its scholarly role.',
        connected: ['The region', 'The world'],
        influence: 'Its heritage of learning still resonates worldwide.',
      },
    },
    dna: {
      geography: 'On the Tigris, between the desert and the fertile plain.',
      history: 'Abbasid capital and a centre of translation.',
      culture: 'Poetry, calligraphy and scholarship.',
    },
    impactChain: [
      { emoji: '📜', label: 'House of Wisdom → Preserved knowledge' },
      { emoji: '📐', label: 'Algebra → Science and computing' },
      { emoji: '🧭', label: 'Astronomy → Navigation' },
      { emoji: '📖', label: 'Translation → Global learning' },
    ],
    flow: ['Geography', 'Translation', 'Science', 'Education', 'Global knowledge', 'Modern world'],
  },
  {
    slug: 'paris',
    name: 'Paris',
    cca3: 'FRA',
    lat: 48.8566,
    lng: 2.3522,
    founded: '3rd century BCE (Parisii)',
    activeFrom: -250,
    activeTo: 2026,
    eras: {
      ancient: {
        existed: 'A settlement of the Parisii on an island in the Seine.',
        happened: 'Roman Lutetia grew on the left bank.',
        changed: 'Roads and baths anchored a river crossroads.',
        connected: ['Lyon', 'Rome', 'The Rhine'],
        influence: 'A river crossing that would become a capital.',
      },
      medieval: {
        existed: 'A royal capital with a cathedral under construction.',
        happened: 'Universities and guilds made it a centre of learning.',
        changed: 'Walls, bridges and the Seine shaped the city.',
        connected: ['Reims', 'London', 'Avignon'],
        influence: 'Gothic architecture and scholastic thought spread outward.',
      },
      industrial: {
        existed: 'A capital transformed by revolution and industry.',
        happened: 'Broad boulevards, railways and expositions remade it.',
        changed: 'Art, fashion and science flourished.',
        connected: ['Europe', 'Empire', 'The Atlantic'],
        influence: 'A capital of ideas whose culture travelled worldwide.',
      },
      current: {
        existed: 'A global city of art, diplomacy and commerce.',
        happened: 'It became a crossroads for the world.',
        changed: 'Landmarks draw visitors from every continent.',
        connected: ['The world'],
        influence: 'Its culture and institutions shape many fields.',
      },
    },
    dna: {
      geography: 'A river basin at the heart of Western Europe.',
      history: 'Roman town, royal capital, revolutionary city.',
      culture: 'Art, philosophy, fashion and cuisine.',
    },
    impactChain: [
      { emoji: '🕍', label: 'Gothic style → World architecture' },
      { emoji: '💡', label: 'Enlightenment → Modern thought' },
      { emoji: '🎨', label: 'Art movements → Global culture' },
      { emoji: '🤝', label: 'Diplomacy → International institutions' },
    ],
    flow: ['Geography', 'River crossing', 'Capital', 'Ideas', 'Culture', 'Modern world'],
  },
  {
    slug: 'timbuktu',
    name: 'Timbuktu',
    cca3: 'MLI',
    lat: 16.7735,
    lng: -3.0074,
    founded: '12th century',
    activeFrom: 1100,
    activeTo: 2026,
    eras: {
      medieval: {
        existed: 'A trading town at the edge of the Sahara.',
        happened: 'Gold, salt and books passed through its markets.',
        changed: 'Mosques and libraries made it a centre of learning.',
        connected: ['Marrakech', 'Gao', 'Cairo', 'North Africa'],
        influence: 'Its manuscripts preserved knowledge across the Sahel.',
      },
      industrial: {
        existed: 'A scholarly town on the desert routes.',
        happened: 'Trade shifted to the coast and the Niger bend.',
        changed: 'Libraries guarded manuscripts through hard times.',
        connected: ['Bamako', 'Niamey', 'Algiers'],
        influence: 'Its heritage kept a whole region’s history alive.',
      },
      current: {
        existed: 'A historic city and UNESCO site.',
        happened: 'Manuscript conservation brought global attention.',
        changed: 'Its libraries are being digitised for the world.',
        connected: ['The world'],
        influence: 'A reminder that African scholarship shaped global knowledge.',
      },
    },
    dna: {
      geography: 'Where the Sahara meets the Niger River.',
      history: 'Caravan crossroads and a city of manuscripts.',
      culture: 'Scholarship, architecture and desert music.',
    },
    impactChain: [
      { emoji: '🧂', label: 'Salt and gold → Trans-Saharan trade' },
      { emoji: '📚', label: 'Manuscripts → Preserved knowledge' },
      { emoji: '🕌', label: 'Universities → African scholarship' },
      { emoji: '🐪', label: 'Caravans → Cultural exchange' },
    ],
    flow: ['Geography', 'Desert routes', 'Trade', 'Scholarship', 'Manuscripts', 'Modern world'],
  },
]

export const historicalPlaces: HistoricalPlace[] = PLACES

const BY_SLUG: Record<string, HistoricalPlace> = Object.fromEntries(
  PLACES.map((p) => [p.slug, p])
)

const BY_NAME: Record<string, HistoricalPlace> = Object.fromEntries(
  PLACES.flatMap((p) => [
    [p.name.toLowerCase(), p],
    [p.slug.replace(/-/g, ' '), p],
  ])
)

export function findHistoricalPlace(slug: string | undefined | null): HistoricalPlace | undefined {
  if (!slug) return undefined
  return BY_SLUG[slug] ?? BY_NAME[slug.toLowerCase()]
}

/** Places whose active span covers the given year. */
export function placesActiveInYear(year: number): HistoricalPlace[] {
  return PLACES.filter((p) => year >= p.activeFrom && year <= p.activeTo)
}

/** Fuzzy match a free-text place name against the known historical cities. */
export function matchHistoricalPlace(name: string | undefined | null): HistoricalPlace | undefined {
  if (!name) return undefined
  const needle = name.toLowerCase()
  for (const place of PLACES) {
    const common = place.name.toLowerCase()
    if (needle === common || needle.includes(common) || common.includes(needle)) return place
  }
  return undefined
}

/* ------------------------------------------------------------------ */
/* Generic (mock) fallbacks for any other place                        */
/* ------------------------------------------------------------------ */

function seed(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pick<T>(list: T[], n: number): T {
  return list[n % list.length]
}

/** Generic era snapshot for any place name. */
export function snapshotFor(name: string, year: number): EraInfo {
  const displayName = (name ?? '').trim() || 'This place'
  const known = matchHistoricalPlace(name)
  if (known) {
    const era = yearToEra(year)
    const found = known.eras[era] ?? Object.values(known.eras).find(Boolean)
    if (found) return found
  }
  const s = seed(displayName)
  const pool = [
    ['A settlement of traders and farmers.', 'Trade routes carried news and goods.', 'Borders and daily life shifted.', 'Neighbouring regions'],
    ['A frontier town on a river or road.', 'Craft and learning flourished.', 'New buildings rose over old ones.', 'Nearby ports and passes'],
    ['A quiet place shaped by its geography.', 'Seasonal movement set the rhythm.', 'Farming and trade adapted to change.', 'The wider region'],
  ]
  const row = pick(pool, s + year)
  return {
    existed: `${row[0]} (${displayName}, around ${year})`,
    happened: row[1],
    changed: row[2],
    connected: [row[3], 'The wider world'],
    influence: `${displayName} quietly passed its ideas along the routes that crossed it.`,
  }
}

/** Place DNA for any place name. */
export function dnaFor(name: string): { geography: string; history: string; culture: string } {
  const displayName = (name ?? '').trim() || 'This place'
  const known = matchHistoricalPlace(name)
  if (known) return known.dna
  return {
    geography: `${displayName} sits where its landscape shaped how people travelled and traded.`,
    history: `${displayName} changed hands and changed shape across the centuries.`,
    culture: `${displayName} blended local traditions with those of passing travellers.`,
  }
}

/** Impact chain for any place name. */
export function impactChainFor(name: string): ImpactLink[] {
  const known = matchHistoricalPlace(name)
  if (known) return known.impactChain
  return [
    { emoji: '🌍', label: 'Geographic position', link: 'Routes and neighbours' },
    { emoji: '🧭', label: 'Discovery or event', link: 'Local change' },
    { emoji: '🤝', label: 'Trade and exchange', link: 'Regional reach' },
    { emoji: '🌐', label: 'Cultural influence', link: 'The wider world' },
  ]
}

/** Place → … → Today flow for any place name. */
export function impactFlowFor(name: string): string[] {
  const displayName = (name ?? '').trim() || 'This place'
  const known = matchHistoricalPlace(name)
  if (known) {
    const flow = known.flow.filter((step) => step && step.trim().length > 0)
    if (flow.length >= 2) {
      const normalized = [displayName, ...flow.slice(1)]
      while (normalized.length < 6) normalized.push('Today')
      return normalized.slice(0, 6)
    }
  }
  return [
    displayName,
    'Local discovery',
    'Regional trade',
    'Migration',
    'Global exchange',
    'Today',
  ]
}
