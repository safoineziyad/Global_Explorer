// Curated natural-wonder content. Slugs are stable and used by routes/sitemap.
//
// Localized copies of every user-visible string live in src/i18n/content.ts.
// The English text here is the reference wording; this module stays a plain,
// importable data source holding structural facts (codes, coordinates, list
// membership) plus that English reference text.

import type { RecordConfidence, Source } from './sources'

export type NatureLocation = {
  lat: number
  lng: number
}

export type NatureSite = {
  slug: string
  name: string
  country: string // ISO 3166-1 alpha-3
  location: NatureLocation
  type: string
  area?: string
  established?: string
  description: string
  wildlife: string[]
  climate: string
  bestTime: string
  activities: string[]
  facts: string[]
  wonderLists?: ('natural-highlights')[]
  /**
   * Whether the site sits on an official natural-wonders register. Curated
   * highlights that are merely widely described as "world wonders" leave this
   * undefined/false, so the UI never implies official status.
   */
  officialWonderList?: boolean
  /** How firmly the record can be stated as fact; drives qualified wording. */
  confidence?: RecordConfidence
  /** Where this record's coordinates and figures were verified. */
  sources?: Source[]
}

export const natureSites: NatureSite[] = [
  {
    slug: 'amazon',
    name: 'Amazon Rainforest',
    country: 'BRA',
    location: { lat: -3.4653, lng: -62.2159 },
    type: 'Tropical rainforest',
    area: 'About 5,500,000 km²',
    established: 'Ancient, protected in parts since the 20th century',
    description:
      'The Amazon is the largest tropical rainforest on Earth, spanning nine countries and drained by the mighty Amazon River. It is one of the most biodiverse places on the planet and a vital carbon sink.',
    wildlife: ['Jaguar', 'Pink river dolphin', 'Harpy eagle', 'Poison dart frog', 'Sloth', 'Howler monkey'],
    climate: 'Hot and humid year-round, with a pronounced wet season',
    bestTime: 'June to November (lower water, more trails)',
    activities: ['River cruises', 'Jungle trekking', 'Wildlife spotting', 'Canoeing', 'Visiting local communities'],
    facts: [
      'It produces a significant share of the world\u2019s oxygen and freshwater.',
      'The Amazon River discharges more water than any other river on Earth.',
      'Millions of species live here, many still undocumented.',
      'Deforestation is a major threat to its ecosystems.',
    ],
    sources: [
      {
        label: 'WWF — Amazon rainforest',
        url: 'https://www.worldwildlife.org/places/amazon',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'grand-canyon',
    name: 'Grand Canyon',
    country: 'USA',
    location: { lat: 36.1069, lng: -112.1129 },
    type: 'Canyon',
    area: '4,927 km² national park',
    established: 'National park in 1919',
    description:
      'The Grand Canyon is a mile-deep chasm carved by the Colorado River through layered red rock. Its immense scale and exposed geology tell a story spanning nearly two billion years.',
    wildlife: ['California condor', 'Bighorn sheep', 'Mule deer', 'Raven', 'Kaibab squirrel'],
    climate: 'Semi-arid; cooler on the rims, much hotter on the canyon floor',
    bestTime: 'March to May and September to November',
    activities: ['Rim hiking', 'Whitewater rafting', 'Scenic drives', 'Stargazing', 'Mule rides'],
    facts: [
      'The canyon is about 446 kilometres long.',
      'Its average depth is roughly 1.6 kilometres.',
      'The Colorado River continues to shape it today.',
      'It is one of the Seven Natural Wonders of the World.',
    ],
    wonderLists: ['natural-highlights'],
    sources: [
      {
        label: 'National Park Service — Grand Canyon',
        url: 'https://www.nps.gov/grca/index.htm',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'niagara-falls',
    name: 'Niagara Falls',
    country: 'CAN',
    location: { lat: 43.0962, lng: -79.0377 },
    type: 'Waterfall',
    area: 'Three waterfalls on the Niagara River',
    established: 'Protected as a reserve in 1885',
    description:
      'Niagara Falls is a group of three powerful waterfalls on the border of Canada and the United States. Horseshoe Falls is the largest and most famous, drawing millions of visitors each year.',
    wildlife: ['Gulls', 'Cormorants', 'Sturgeon', 'Beaver', 'White-tailed deer'],
    climate: 'Continental, with cold winters and warm summers',
    bestTime: 'June to August, and December for the Festival of Lights',
    activities: ['Boat tours', 'Cave of the Winds', 'Observation decks', 'Nightly illumination', 'Hornblower cruises'],
    facts: [
      'Around 2,800 cubic metres of water flow over the falls every second.',
      'The falls have retreated several kilometres over thousands of years.',
      'Hydroelectric stations divert water for power generation.',
      'The Canadian Horseshoe Falls is the widest of the three.',
    ],
    sources: [
      {
        label: 'Niagara Parks Commission',
        url: 'https://www.niagarafalls.ca/',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'serengeti',
    name: 'Serengeti National Park',
    country: 'TZA',
    location: { lat: -2.3333, lng: 34.8333 },
    type: 'Savanna',
    area: '14,750 km²',
    established: 'National park in 1951',
    description:
      'The Serengeti is a vast savanna ecosystem famed for the Great Migration, when millions of wildebeest and zebra move in search of greener pastures. It hosts one of the greatest concentrations of wildlife on Earth.',
    wildlife: ['Wildebeest', 'Zebra', 'Lion', 'Cheetah', 'Leopard', 'Elephant', 'Black rhinoceros'],
    climate: 'Tropical savanna, with a long dry season and short rains',
    bestTime: 'June to October (dry season and river crossings)',
    activities: ['Game drives', 'Hot-air balloon safaris', 'Migration viewing', 'Birdwatching', 'Cultural visits'],
    facts: [
      'The Great Migration involves around 1.5 million wildebeest.',
      'It is part of the larger Serengeti-Mara ecosystem.',
      'The park is a UNESCO World Heritage Site.',
      'Predators gather along the Grumeti and Mara rivers during crossings.',
    ],
    sources: [
      {
        label: 'UNESCO World Heritage Centre — Serengeti',
        url: 'https://whc.unesco.org/en/list/156/',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'galapagos',
    name: 'Galápagos Islands',
    country: 'ECU',
    location: { lat: -0.9538, lng: -90.9656 },
    type: 'Volcanic archipelago',
    area: 'About 8,010 km²',
    established: 'National park in 1959',
    description:
      'The Galápagos Islands are a volcanic archipelago in the Pacific whose unique species helped inspire Charles Darwin\u2019s theory of evolution. Its wildlife is famously fearless of humans.',
    wildlife: ['Giant tortoise', 'Marine iguana', 'Blue-footed booby', 'Galápagos penguin', 'Sea lion', 'Waved albatross'],
    climate: 'Subtropical, with a cool dry season and a warm wet season',
    bestTime: 'June to November (cooler) and December to May (warmer)',
    activities: ['Snorkelling', 'Diving', 'Wildlife watching', 'Hiking', 'Island hopping'],
    facts: [
      'The islands sit on a volcanic hotspot.',
      'Darwin visited in 1835 aboard HMS Beagle.',
      'Many species are found nowhere else on Earth.',
      'Strict visitor rules help protect the fragile ecosystem.',
    ],
    sources: [
      {
        label: 'UNESCO World Heritage Centre — Galapagos Islands',
        url: 'https://whc.unesco.org/en/list/146/',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'great-barrier-reef',
    name: 'Great Barrier Reef',
    country: 'AUS',
    location: { lat: -18.2871, lng: 147.6992 },
    type: 'Coral reef',
    area: 'About 344,400 km²',
    established: 'Marine park in 1975',
    description:
      'The Great Barrier Reef is the world\u2019s largest coral reef system, a labyrinth of thousands of reefs and islands off the coast of Queensland. It teems with marine life and is visible from space.',
    wildlife: ['Clownfish', 'Green sea turtle', 'Reef shark', 'Humpback whale', 'Giant clam', 'Manta ray'],
    climate: 'Tropical, warm year-round',
    bestTime: 'June to October (dry season, clear water)',
    activities: ['Diving', 'Snorkelling', 'Glass-bottom boat tours', 'Sailing', 'Helicopter flights'],
    facts: [
      'It is composed of around 2,900 individual reefs.',
      'It supports an extraordinary diversity of marine species.',
      'Coral bleaching linked to warming seas is a major concern.',
      'It is a UNESCO World Heritage Site.',
    ],
    wonderLists: ['natural-highlights'],
    sources: [
      {
        label: 'UNESCO World Heritage Centre — Great Barrier Reef',
        url: 'https://whc.unesco.org/en/list/154/',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'yellowstone',
    name: 'Yellowstone National Park',
    country: 'USA',
    location: { lat: 44.428, lng: -110.5885 },
    type: 'Volcanic plateau and wilderness',
    area: '8,991 km²',
    established: 'World\u2019s first national park, 1872',
    description:
      'Yellowstone sits atop a vast volcanic hotspot and contains more than half of the world\u2019s geysers. Its geothermal features, canyons and wildlife make it a landmark of conservation.',
    wildlife: ['Gray wolf', 'Bison', 'Grizzly bear', 'Elk', 'Bald eagle', 'Trumpeter swan'],
    climate: 'Continental, with short cool summers and long cold winters',
    bestTime: 'June to September',
    activities: ['Geyser watching', 'Wildlife viewing', 'Hiking', 'Camping', 'Cross-country skiing'],
    facts: [
      'Old Faithful erupts on a fairly predictable schedule.',
      'The park sits on a dormant supervolcano.',
      'It was the first national park in the world.',
      'Wolves were reintroduced in 1995 after decades of absence.',
    ],
    sources: [
      {
        label: 'National Park Service — Yellowstone',
        url: 'https://www.nps.gov/yell/index.htm',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'banff',
    name: 'Banff National Park',
    country: 'CAN',
    location: { lat: 51.4968, lng: -115.9281 },
    type: 'Mountain park',
    area: '6,641 km²',
    established: 'Canada\u2019s first national park, 1885',
    description:
      'Banff is Canada\u2019s oldest national park, set in the Rocky Mountains around turquoise glacial lakes, rugged peaks and hot springs. It is a year-round destination for outdoor adventure.',
    wildlife: ['Grizzly bear', 'Bighorn sheep', 'Moose', 'Elk', 'Wolf', 'Golden eagle'],
    climate: 'Subarctic to alpine, with long snowy winters',
    bestTime: 'June to August, and December to March for snow sports',
    activities: ['Hiking', 'Skiing', 'Canoeing', 'Scenic drives', 'Wildlife watching'],
    facts: [
      'Lake Louise is famous for its vivid turquoise colour.',
      'The park is part of the Canadian Rocky Mountain Parks World Heritage Site.',
      'The Icefields Parkway links Banff with Jasper.',
      'Hot springs in the park helped inspire its creation.',
    ],
    sources: [
      {
        label: 'Parks Canada — Banff National Park',
        url: 'https://parks.canada.ca/pn-np/ab/banff',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'patagonia',
    name: 'Patagonia',
    country: 'ARG',
    location: { lat: -49.3, lng: -73.0 },
    type: 'Region of mountains, steppe and ice fields',
    area: 'About 1,043,000 km²',
    established: 'Protected across many national parks',
    description:
      'Patagonia is a vast region at the southern tip of South America shared by Argentina and Chile. It is known for dramatic granite peaks, glaciers, windswept steppe and pristine wilderness.',
    wildlife: ['Guanaco', 'Andean condor', 'Magellanic penguin', 'Puma', 'Southern right whale', 'Huemul deer'],
    climate: 'Cool and windy, with frequent weather changes',
    bestTime: 'November to March (southern summer)',
    activities: ['Trekking', 'Glacier walking', 'Kayaking', 'Wildlife watching', 'Scenic flights'],
    facts: [
      'The region includes the Southern Patagonian Ice Field.',
      'Mount Fitz Roy and Torres del Paine are iconic peaks.',
      'The Perito Moreno Glacier is one of the few that advances.',
      'Its name comes from the word used by Magellan for local inhabitants.',
    ],
    sources: [
      {
        label: 'UNESCO World Heritage Centre — Los Glaciares',
        url: 'https://whc.unesco.org/en/list/145/',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'yosemite',
    name: 'Yosemite National Park',
    country: 'USA',
    location: { lat: 37.8651, lng: -119.5383 },
    type: 'Glacial valley and park',
    area: '3,027 km²',
    established: 'National park in 1890',
    description:
      'Yosemite is celebrated for its towering granite cliffs, giant sequoias and spectacular waterfalls. Its glacier-carved valley is one of the most recognisable landscapes in North America.',
    wildlife: ['American black bear', 'Mule deer', 'Bobcat', 'Peregrine falcon', 'Mountain chickadee', 'Sierra Nevada bighorn sheep'],
    climate: 'Mediterranean to alpine, with snowy winters and dry summers',
    bestTime: 'May to September',
    activities: ['Hiking', 'Rock climbing', 'Scenic drives', 'Photography', 'Camping'],
    facts: [
      'El Capitan is a granite monolith about 900 metres tall.',
      'Yosemite Falls is among the tallest waterfalls in North America.',
      'Giant sequoias here can live for over 3,000 years.',
      'The park helped inspire the modern conservation movement.',
    ],
    // Yosemite is emphatically a world-class natural wonder, but it is not on
    // any published natural-wonders register we can cite, so it must not claim
    // official status. Left undefined (same as `amazon`) rather than asserted.
    officialWonderList: false,
    confidence: 'verified',
    sources: [
      {
        label: 'National Park Service — Yosemite',
        url: 'https://www.nps.gov/yose/index.htm',
        checked: '2026-10-04',
      },
      {
        label: 'UNESCO World Heritage Centre — Yosemite National Park',
        url: 'https://whc.unesco.org/en/list/308/',
        checked: '2026-10-04',
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Natural-wonder highlights.                                          */
  /* This is a curated selection, not an official or complete canon — see  */
  /* WONDER_LIST_META['natural-highlights'] and each record's              */
  /* `officialWonderList` flag.                                          */
  /* ------------------------------------------------------------------ */

  {
    slug: 'victoria-falls',
    name: 'Victoria Falls',
    country: 'ZWE',
    location: { lat: -17.9243, lng: 25.8572 },
    type: 'Waterfall',
    area: 'About 1,088 m wide and 108 m high at the main falls',
    established: 'Mosi-oa-Tunya National Park since 2019',
    description:
      'Victoria Falls is a broad curtain of water on the Zambezi River at the border of Zambia and Zimbabwe. Its local name, Mosi-oa-Tunya, is usually translated as “the smoke that thunders”.',
    wildlife: ['African elephant', 'Cape buffalo', 'Lion', 'White rhinoceros', 'Giraffe', 'Pygmy hippo'],
    climate: 'Tropical savanna, with the main rains from November to March',
    bestTime: 'May to September, when the falls are at their widest',
    activities: ['Canoeing the upper Zambezi', 'Rafting below the falls', 'Bungee jumping', 'Game viewing', 'Sunset walks'],
    facts: [
      'It is roughly twice as wide as Niagara Falls, though not as high.',
      'The local name Mosi-oa-Tunya is usually translated as “the smoke that thunders”.',
      'The falls sit in a basalt gorge left by ancient lava flows.',
      'Its spray can be heard before the falls themselves come into view.',
    ],
    wonderLists: ['natural-highlights'],
    officialWonderList: true,
    confidence: 'verified',
    sources: [
      {
        label: 'UNESCO World Heritage Centre — Mosi-oa-Tunya/Victoria Falls',
        url: 'https://whc.unesco.org/en/list/364/',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'iguazu-falls',
    name: 'Iguazú Falls',
    country: 'ARG',
    location: { lat: -25.6867, lng: -54.4448 },
    type: 'Waterfall',
    area: 'About 2,700 m of waterfall along the Argentina–Brazil border',
    established: 'National park since 1902; UNESCO since 1986',
    description:
      'Iguazú Falls is a long series of cataracts on the Iguazú River on the border of Argentina and Brazil. In Guaraní, “iguazú” is usually translated as “big water”.',
    wildlife: ['Jaguar', 'Black caiman', 'Giant anteater', 'Howler monkey', 'Capybara', 'Helmeted woodpecker'],
    climate: 'Subtropical and humid, with rain throughout the year',
    bestTime: 'April to June and September to November',
    activities: ['Upper and lower circuit trails', 'Train to the falls', 'Boat rides', 'Wildlife watching', 'Birding'],
    facts: [
      'The Devil’s Throat is the largest single drop in the system.',
      'The name is commonly translated from Guaraní as “big water”.',
      'Many plants and animals around the falls occur nowhere else on Earth.',
      'The falls can be visited from either the Argentine or the Brazilian side.',
    ],
    wonderLists: ['natural-highlights'],
    officialWonderList: true,
    confidence: 'verified',
    sources: [
      {
        label: 'UNESCO World Heritage Centre — Iguazú Falls',
        url: 'https://whc.unesco.org/en/list/145/',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'lake-baikal',
    name: 'Lake Baikal',
    country: 'RUS',
    location: { lat: 53.5587, lng: 108.165 },
    type: 'Freshwater lake',
    area: 'About 31,722 km²',
    established: 'UNESCO World Heritage Site since 1998',
    description:
      'Lake Baikal in southern Siberia is the deepest lake on Earth and holds roughly a fifth of the world’s unfrozen fresh water. Large parts of its bed lie well below the surrounding land, in a rift basin.',
    wildlife: ['Baikal seal', 'Baikal omul', 'Baikal gray wolf', 'Red deer', 'Buryat crane'],
    climate: 'Continental extreme, with very severe winters and deep ice',
    bestTime: 'June to September; ice caves in winter',
    activities: ['Winter ice caves', 'Boat and hydrofoil trips', 'Shoreline hiking', 'Seal observation', 'Spring ice photography'],
    facts: [
      'It reaches a depth of about 1,642 metres.',
      'It is the largest freshwater lake by volume in the world.',
      'Around 80% of its animal life is found nowhere else.',
      'Its winter ice can reach about a metre thick.',
    ],
    wonderLists: ['natural-highlights'],
    officialWonderList: true,
    confidence: 'verified',
    sources: [
      {
        label: 'UNESCO World Heritage Centre — Lake Baikal',
        url: 'https://whc.unesco.org/en/list/208/',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'halong-bay',
    name: 'Hạ Long Bay',
    country: 'VNM',
    location: { lat: 20.9101, lng: 107.1839 },
    type: 'Bay of limestone karst islands',
    area: 'About 1,553 km²',
    established: 'UNESCO World Heritage Site since 1994',
    description:
      'Hạ Long Bay is a UNESCO World Heritage Site in northern Vietnam, famous for the thousands of limestone islands and islets that rise from the sea. Its name is usually translated as “descending dragon bay”.',
    wildlife: ['Whale shark', 'Catfish', 'Dolphin', 'Asian black bear', 'Oriental white stork'],
    climate: 'Monsoonal, with wet summers and cooler, drier winters',
    bestTime: 'October to December and March to May',
    activities: ['Overnight boat cruises', 'Kayaking', 'Cave visits', 'Fishing villages', 'Bird watching'],
    facts: [
      'The bay contains more than 1,600 islands, islets and rock outcrops.',
      'Its karst towers formed over hundreds of millions of years.',
      'It is also written Ha Long Bay in international usage.',
      'Fishing has shaped the bay’s communities for centuries.',
    ],
    wonderLists: ['natural-highlights'],
    officialWonderList: true,
    confidence: 'verified',
    sources: [
      {
        label: 'UNESCO World Heritage Centre — Ha Long Bay',
        url: 'https://whc.unesco.org/en/list/544/',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'angel-falls',
    name: 'Angel Falls',
    country: 'VEN',
    location: { lat: 5.9706, lng: -62.5281 },
    type: 'Waterfall',
    area: '979 m total drop; the longest uninterrupted descent',
    established: 'Part of Canaima National Park, a UNESCO site since 2009',
    description:
      'Angel Falls is a waterfall in Canaima National Park, Venezuela, falling from the Auyán-tepui plateau. It is widely described as the world’s highest uninterrupted waterfall. The Pemón name Kerepakupai Merú is usually translated as “the deepest place on Earth”.',
    wildlife: ['Spectacled bear', 'Orinoco crocodile', 'Harpy eagle', 'Golden lion tamarin'],
    climate: 'Tropical and wet all year, with a rainier season',
    bestTime: 'June to December',
    activities: ['Airstrip landings on the tepui', 'River travel on the Caroní', 'Canoeing', 'Bird watching', 'Guided hikes'],
    facts: [
      'It drops 979 m in total, with an unbroken run of roughly 807 m.',
      'It is named after aviator Jimmie Angel, who flew over it in 1933.',
      'Its base is so remote that it can take days to reach by river.',
      'The surrounding tepuis are among the oldest exposed rock formations on Earth.',
    ],
    // Curated highlight like the other entries in this section, but not on any
    // register we can cite.
    wonderLists: ['natural-highlights'],
    officialWonderList: false,
    confidence: 'verified',
    sources: [
      {
        label: 'UNESCO World Heritage Centre — Canaima National Park',
        url: 'https://whc.unesco.org/en/list/1126/',
        checked: '2026-10-04',
      },
    ],
  },
  {
    slug: 'sahara',
    name: 'Sahara Desert',
    country: 'DZA',
    location: { lat: 25, lng: 13 },
    type: 'Hot desert',
    area: 'About 9,200,000 km²',
    established: 'Protected areas established across the region',
    description:
      'The Sahara is the largest hot desert in the world, covering much of North Africa. Despite its reputation, a great deal of its surface is rocky desert rather than sand, and it has been far greener during earlier humid periods.',
    wildlife: ['Fennec fox', 'Addax', 'Dromedary camel', 'Saharan cheetah', 'Scimitar oryx'],
    climate: 'Hot desert, with very large differences between day and night',
    bestTime: 'October to March, for cooler weather',
    activities: ['Dune trekking', 'Oasis visits', 'Rock art sites', 'Night sky observing', 'Camel journeys'],
    facts: [
      'Its area is roughly comparable to that of the United States.',
      'The largest dune fields lie in the south, in the Erg Chebbi and Erg Murzuk regions.',
      'It has repeatedly been far greener during the African humid periods.',
      'It is the largest hot desert, unlike the much colder Antarctic desert.',
    ],
    confidence: 'verified',
    sources: [
      {
        label: 'NASA Earth Observatory',
        url: 'https://earthobservatory.nasa.gov/',
        checked: '2026-10-04',
      },
    ],
  },
]

export const natureBySlug: Record<string, NatureSite> = Object.fromEntries(
  natureSites.map((site) => [site.slug, site])
)

export function findNatureSite(slug: string | undefined | null): NatureSite | undefined {
  if (!slug) return undefined
  return natureBySlug[slug]
}

export function natureByCountry(cca3: string): NatureSite[] {
  return natureSites.filter((site) => site.country === cca3.toUpperCase())
}
