// Curated natural-wonder content. Slugs are stable and used by routes/sitemap.

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
