# Country facts research — bundled REST Countries dataset

Research deliverable for the "Global Explorer" SPA. **Read-only investigation.** No source file was
modified. This document reports (a) the values currently bundled in `public/data/countries.json`,
verbatim, and (b) what could and could not be independently verified against authoritative sources
for the questionable records.

- **Date checked:** 2026-10-04
- **Method:** targeted `node -e` reads of `public/data/countries.json` (printing only requested
  fields), plus web fetch/search for external verification. Every external claim below carries a URL.
- **Nothing here is estimated.** Where a figure could not be traced to a named publisher it is
  labelled *could not verify* rather than guessed.

---

## 1. Bundled values (unverified) — extracted verbatim

### 1.1 SJM — Svalbard and Jan Mayen (the `area` concern)

Full bundled record, exactly as stored:

```json
{"cca3":"SJM","cca2":"SJ","name":{"common":"Svalbard and Jan Mayen","official":"Svalbard og Jan Mayen"},"capital":["Longyearbyen"],"region":"Europe","subregion":"Northern Europe","area":61399,"latlng":[78,20],"languages":{"nor":"Norwegian"},"currencies":{"NOK":{"name":"krone","symbol":"kr"}},"borders":[],"tld":[".sj"],"independent":false,"unMember":false,"landlocked":false,"maps":{...}}
```

| field | bundled value (unverified) |
|---|---|
| cca3 | `SJM` |
| cca2 | `SJ` |
| name.common | `Svalbard and Jan Mayen` |
| name.official | `Svalbard og Jan Mayen` |
| capital | `["Longyearbyen"]` |
| region / subregion | `Europe` / `Northern Europe` |
| **area** | **`61399`** |
| **population** | **field absent entirely** (no `population` key on the record) |
| borders | `[]` |
| timezones | **field does not exist anywhere in this dataset** (see 1.4) |
| latlng | `[78, 20]` |
| languages / currencies / tld | `{nor: Norwegian}` / `{NOK: krone}` / `[".sj"]` |
| independent / unMember / landlocked | `false` / `false` / `false` |

Notes on this record specifically:
- `population` is **missing**, not zero. 35 of the 250 records have no `population` key at all.
- `latlng: [78, 20]` is a whole-degree round of the group's extent (the archipelago spans roughly
  74–81°N, 10–35°E), so it is a representative point, not a centroid I can verify.

### 1.2 Other commonly-problematic territories — bundled values (unverified)

Only SJM was verified against primary sources in this pass (see §2). The values below are reported
verbatim as bundled; their `area` figures were **not** verified.

| cca3 | name.common | area | population | capital | latlng | notes |
|---|---|---|---|---|---|---|
| `GRL` | Greenland | 2166086 | 56836 | `["Nuuk"]` | `[72,-40]` | `cca2 GL`, `.gl` |
| `ATA` | Antarctica | 14000000 | **absent** | `[]` | `[-90,0]` | round-looking figure; no capital |
| `ATF` | French Southern and Antarctic Lands | 7747 | **absent** | `["Port-aux-Français"]` | `[-49.25,69.167]` | |
| `BVT` | Bouvet Island | 49 | **absent** | `[]` | `[-54.43333333,3.4]` | no capital |
| `HMD` | Heard Island and McDonald Islands | 412 | **absent** | `[]` | `[-53.1,72.51666666]` | no capital |
| `SGS` | South Georgia | 3903 | **absent** | `["King Edward Point"]` | `[-54.5,-37]` | **internal inconsistency:** `name.common` is "South Georgia" but `name.official` is "South Georgia and the South Sandwich Islands"; a single `area` cannot be both |
| `IOT` | British Indian Ocean Territory | 60 | **absent** | `["Diego Garcia"]` | `[-6,71.5]` | |
| `COK` | Cook Islands | 236 | **absent** | `["Avarua"]` | `[-21.23333333,-159.76666666]` | `independent:false`, `unMember:false` |
| `NFK` | Norfolk Island | 36 | **absent** | `["Kingston"]` | `[-29.03333333,167.95]` | |
| `UMI` | United States Minor Outlying Islands | 34.2 | **absent** | `[]` | `[19.3,166.633333]` | no capital; non-integer area |
| `ASM` | American Samoa | 199 | 46765 | `["Pago Pago"]` | `[-14.33333333,-170]` | |
| `PRI` | Puerto Rico | 8870 | 3202521 | `["San Juan"]` | `[18.25,-66.5]` | |
| `HKG` | Hong Kong | 1104 | 7524100 | `["City of Victoria"]` | `[22.267,114.188]` | capital recorded as "City of Victoria" (a HK urban district name, not obviously the de facto capital); `borders:["CHN"]` |
| `MNP` | Northern Mariana Islands | 464 | 44278 | `["Saipan"]` | `[15.2,145.75]` | |
| `GUM` | Guam | 549 | 167777 | `["Hagåtña"]` | `[13.46666666,144.78333333]` | |
| `VGB` | British Virgin Islands | 151 | 39471 | `["Road Town"]` | `[18.431383,-64.62305]` | |
| `CYP` | Cyprus | 9251 | 1358282 | `["Nicosia"]` | `[35,33]` | `independent:true`, `unMember:true`, `borders:[]` (no land borders; neighbours are across the UN buffer zone) |
| `MNE` | Montenegro | 13812 | 623525 | `["Podgorica"]` | `[42.5,19.3]` | `borders:["ALB","BIH","HRV","UNK","SRB"]` — **includes `UNK`**, a placeholder code, not an ISO 3166-1 alpha-3 |
| `KOS` | — | — | — | — | — | **not present** |
| `XKX` | — | — | — | — | — | **not present**; Kosovo is instead stored under the pseudo-code `UNK` (cca2 `XK`, `independent: null`, `borders:["ALB","MKD","MNE","SRB"]`, area 10908, population absent). `UNK` is **not** an ISO 3166-1 alpha-3 code. |

### 1.3 Dataset-level integrity (verified, internal checks only)

| check | result |
|---|---|
| record count | **exactly 250** |
| every record has a 3-letter uppercase `alpha_3`? | **yes** — `/^[A-Z]{3}$/` matched all 250 |
| every record has a non-empty `name.common`? | **yes** — no empty/whitespace common names |
| duplicate `cca3` | none |
| `unMember === true` | **194** (not 193; see note) |
| `unMember === false` | 56 |
| `independent === true` | 194; `independent === false` | 55; `independent === null` | 1 (`UNK`) |
| every record has an `area` key | yes, all numeric |
| every record has a `capital` key | yes (5 records have an **empty** `capital: []`: `ATA`, `BVT`, `HMD`, `MAC`, `UMI`) |
| records with **no** `population` key | **35** (`AIA`, `ALA`, `ATA`, `ATF`, `BES`, `BLM`, `BVT`, `CCK`, `COK`, `CXR`, `ESH`, `FLK`, `GGY`, `GLP`, `GUF`, `HMD`, `IOT`, `JEY`, `MSR`, `MTQ`, `MYT`, `NFK`, `NIU`, `PCN`, `REU`, `SGS`, `SHN`, **`SJM`**, `SPM`, `TKL`, `TWN`, `UMI`, `UNK`, `VAT`, `WLF`) |

Note on "250 countries": the file holds **250 records**, of which 194 are UN-member states. 250 is the
REST Countries dataset size (states + dependencies + a Kosovo placeholder), so it should not be
described to users as "250 countries". `unMember:true` count of 194 is itself one above the UN's 193
member states; I did **not** investigate which record accounts for that and therefore **could not
verify** it.

### 1.4 Structural gaps found (relevant to "timezones")

The task asked for `timezones`. **There is no `timezones` field anywhere in this dataset** — checked
all 250 records; zero have the key. The complete set of keys present across the whole file is:
`area, borders, capital, cca2, cca3, currencies, independent, landlocked, languages, latlng, maps,
name, population, region, subregion, tld, unMember`. There are also **no `flags` and no `startOfWeek`
fields**, even though `scripts/sync-countries.mjs` (lines 50–54, 155–180) requests and normalises
`timezones`, `flag` and `start_of_week`. Conclusion: the bundle was written before those code paths,
or the sync has not been re-run. So `timezones` **cannot be reported** for any record — it is not
questionable data, it is absent data.

### 1.5 Provenance of the bundled file (from the repo)

- `scripts/sync-countries.mjs` documents that the bundle is refreshed from the **REST Countries v5
  API** (`https://api.restcountries.com/countries/v5`), merge-never-replace, with `area: -1` treated
  as "unknown" and never persisted.
- Because the script refuses to persist `-1`, the bundled `61399` was necessarily supplied by the v5
  API, not invented locally.
- The script also validates exactly the two properties I re-checked in §1.3 (3-letter uppercase
  alpha_3 + non-empty `name.common`) — consistent with what I observed.

---

## 2. Svalbard and Jan Mayen — authoritative area verification

### 2.1 The ISO entry is one country record but two separate landmasses with two jurisdictions

This is the structural crux, and it is well documented.

- **ISO 3166-1** assigns a single code to the grouping: `SJ` / `SJM` / numeric `744`, named "Svalbard
  and Jan Mayen". The **United Nations Statistics Division M49** classification (official UN, and
  the one source I could machine-read that lists the code) confirms the entry: *"Svalbard and Jan
  Mayen Islands · 744 · SJ · SJM · Europe · Northern Europe"* —
  <https://unstats.un.org/unsd/methodology/m49/overview/>
- The two halves are **not administratively related**. Svalbard is administered by the *Sysselmester*
  (Governor of Svalbard) under the Svalbard Treaty; Jan Mayen since 1994 is administered by the
  *Statsforvalteren i Nordland* (County Governor of Nordland) and is **expressly not covered by the
  Svalbard Treaty** ("Øya er ikke et biland og omfattes ikke av Svalbardtraktaten"), nor is it part of
  Nordland county. — Store norske leksikon, *Jan Mayen* —
  <https://snl.no/Jan_Mayen> (article "Sist oppdatert: 28. august 2026")
- They are further coded separately under Norway's own ISO 3166-2 subdivisions, `NO-21` (Svalbard)
  and `NO-22` (Jan Mayen), and **no** ISO 3166-2 codes exist for the `SJ` entry itself. See
  `ISO 3166-2:SJ` — <https://en.wikipedia.org/wiki/ISO_3166-2:SJ> (secondary; it cites ISO Online
  Browsing Platform, which I could not read directly — see §4).
- Wikipedia's dedicated article states the same, and confirms the single `.sj` ccTLD was issued for
  the combined group: <https://en.wikipedia.org/wiki/Svalbard_and_Jan_Mayen>

**Consequence:** a single scalar `area` field on the `SJM` record **cannot** represent both
landmasses. It is necessarily either one of them, or their sum. Any user-facing wording that says
"area of Svalbard and Jan Mayen = 61,399 km²" is therefore ambiguous unless it says explicitly that
it is a *combined* total.

### 2.2 Svalbard archipelago — verified area

Multiple authoritative Norwegian sources converge on **~61,020 km²**:

| figure | source | publisher | as of / version | URL |
|---|---|---|---|---|
| "about 61 020 square kilometers" (land mass) | *The Arctic → Svalbard* topic page | **Norwegian Polar Institute** (Norsk Polarinstitutt) | page as archived 19 Feb 2012 (earlier capture 24 Jul 2011) | <https://web.archive.org/web/20120219235338/http://www.npolar.no/en/the-arctic/svalbard/index.html> |
| **61 022 km²** ("Landareal") | *Svalbard*, fact box + body | **Store norske leksikon** | "Sist oppdatert: 28. september 2026" | <https://snl.no/Svalbard> |
| **61 022 km²** ("Samlet landareal") | *Fakta om Longyearbyen* | **Longyearbyen lokalstyre** (the state-supervised local government on Svalbard) | "Sist oppdatert 30. april 2025" | <https://www.lokalstyre.no/tjenester/innbyggerinformasjon/om-longyearbyen-lokalstyre/fakta-om-longyearbyen> |
| "Svalbard (61 022 km2) and Jan Mayen (377 km2)", explicitly *excluded* from Norway's area | *Nordic Statistical Yearbook 2014* | Nordic Council of Ministers / Nordic cooperation (statistics yearbook) | 2014 edition | <https://norden.diva-portal.org/smash/get/diva2:763002/FULLTEXT07.pdf> |
| "Svalbard har eit landareal på 61 022 km2 og utgjer ca. 16 pst. av det …" | *Prop. 1 S (2024–2025)*, Svalbard budget white paper, footnote citing **SSB rapport 2023/36** *Samfunnsforhold på Svalbard* | Norwegian Government (regjeringen.no) | 2024–2025 budget | <https://www.regjeringen.no/contentassets/80b7e9b7ba9e45e0ad904c50214c1bfb/nn-no/pdfs/prp202420250001svadddpdfs.pdf> |

Verbatim, SNL: *"Svalbard er et fellesnavn på ishavsøyene … Øyene utgjør en del av kongeriket Norge,
dekker 61 022 kvadratkilometer og har 2914 innbyggere (2026)."*

**Verification status: VERIFIED.** Svalbard = ~61,020 km² (SSB/NPI/Longyearbyen lokalstyre/Nordic
yearbook/Government white paper all agree on 61,022 ± 2). The NPI wording is "about 61 020", so
61,022 should be presented as the SSB-sourced figure, not as a precise measurement.

Caveat on method: I read SNL, Longyearbyen lokalstyre and UN M49 by direct fetch. `regjeringen.no`
returned **HTTP 403** to automated fetch, `iso.org` returned **HTTP 403**, and `npolar.no` returned
**HTTP 403** on every URL variant I tried — so for those three I have direct content only via the
Internet Archive capture (NPI) or via the search index of the official document
(Prop. 1 S). This is flagged again in §4.

### 2.3 Jan Mayen island — verified area

**377 km²**, verified:

| figure | source | publisher | as of | URL |
|---|---|---|---|---|
| **377 km²** ("Landareal") | *Jan Mayen*, fact box + body ("Arealet er 377 kvadratkilometer") | **Store norske leksikon** | "Sist oppdatert: 28. august 2026" | <https://snl.no/Jan_Mayen> |
| "The island is 53 km long and covers **377 km2**" | *Jan Mayen* topic page | **Norwegian Polar Institute** | page current at check time | <https://npolar.no/en/themes/jan-mayen/> |
| "Svalbard (61 022 km2) and Jan Mayen (377 km2)" | *Nordic Statistical Yearbook 2014* | Nordic Council of Ministers | 2014 edition | <https://norden.diva-portal.org/smash/get/diva2:763002/FULLTEXT07.pdf> |

**Verification status: VERIFIED (SNL + Nordic yearbook, direct fetch).** The NPI page value (377 km²)
was visible to me only in the search index because `npolar.no` blocks automated requests (HTTP 403) —
so treat NPI as corroborating, and SNL/yearbook as the directly-read authorities.

One adjacent figure to avoid confusing with it: the **Jan Mayen nature reserve** has a land area of
**375 km²** (plus 4,315 km² of sea) per SNL, quoting the protection regulation — that is the reserve,
not the island. Source: <https://snl.no/Jan_Mayen>.

### 2.4 The arithmetic verdict: 61,399 is exactly the combined total

```
 61,022  (Svalbard, SSB/SNL/NPI/lokalstyre/Nordic yearbook)
   377  (Jan Mayen, SNL/NPI/Nordic yearbook)
-------
 61,399  <-- exactly the bundled `area` for SJM
```

`61_022 + 377 === 61_399` (computed to confirm, not estimated). This is a strong, specific finding:

> The bundled `SJM.area = 61399` is **arithmetically identical to the sum of the two authoritative
> component areas**. It is therefore a *combined* figure for the whole ISO 3166-1 group, not an
> area for Svalbard alone, and not an area for Jan Mayen.

Supporting but non-authoritative corroboration: the English Wikipedia article "Svalbard and Jan Mayen"
carries `| area_km2 = 61,399` in its infobox with **no citation attached to that field**, while the
same article's body gives Svalbard as 61,022 km² and Jan Mayen as 377 km² —
<https://en.wikipedia.org/wiki/Svalbard_and_Jan_Mayen>. That uncited infobox figure is a plausible
proximate origin of the number in circulation, but Wikipedia is not an authority and I am not
treating it as one.

### 2.5 Does the area include glaciers / ice? — yes

The Svalbard figure is total surface area of the islands, **including glacier and ice-cap cover**:

- SNL (*Svalbard*): *"Landskapet er dominert av isbreer som dekker nær 61 prosent av landarealet"* —
  glaciers cover nearly 61% of the land area. <https://snl.no/Svalbard>
- Longyearbyen lokalstyre: *"Rundt 60 prosent av øygruppen er dekt av isbreer."* Same URL as §2.2.
- Jan Mayen is likewise "partly covered by glaciers" (SNL describes Weyprechtbreen and Kjerulfbreen as
  reaching the sea). <https://snl.no/Jan_Mayen>

So 61,022 km² is a *gross land-surface* figure, not an ice-free area. Two consequences:
1. A derived "land area" or "arable/vegetated area" number must not be computed from it.
2. The Norwegian term used by all these sources is *landareal* ("land area"), which in this context
   means the islands' total surface — it does **not** exclude inland ice. Anyone translating this
   should not present it as "land area excluding glaciers".

A specific secondary figure I did **not** verify from a primary source: English Wikipedia states
"Glacial ice covers 36,502 km² or 60% of Svalbard" citing a 2005 book (Umbreit). Treat as unverified.

### 2.6 Where 61,399 came from — REST Countries' own documented source (and why it is not authoritative)

- REST Countries (apilayer) documents its data sources in its README: **"Area" → `en.wikipedia.org`
  `List of countries and_dependencies_by_area`** (alongside `mledoze/countries` for the country list,
  languages and currencies). <https://github.com/apilayer/restcountries> (README, "Sources" section)
  The same page's reference link resolves to
  <https://en.wikipedia.org/wiki/List_of_countries_and_dependencies_by_area>.
- That Wikipedia list **does not currently contain a 61,399 row for Svalbard and Jan Mayen.** Reading
  its current wikitext: the *Svalbard* row is **62,045 km²** (attributed to the CIA World Factbook)
  and the *Jan Mayen* row is **377 km²** (CIA); its footnote states *"The UN gives a combined area for
  Svalbard and Jan Mayen as 62,422 km²."*
- The `mledoze/countries` upstream dataset — the canonical open country list — records
  **`"area": -1`** for SJM, i.e. **"unknown"**. Verified by direct fetch of
  <https://raw.githubusercontent.com/mledoze/countries/master/countries.json> (250 records; the SJM
  record's `area` is `-1`).
- Therefore: **REST Countries' documented source does not contain 61,399, and its open upstream marks
  the SJM area as unknown.** I could not verify REST Countries' actual derivation of 61,399.
  The v3.1 public endpoint now returns a deprecation error
  (`"This API version has been deprecated … migrate to our new version (v5)"`,
  <https://restcountries.com/v3.1/alpha/sjm>) and v5 requires a bearer API key, which I did not use
  and will not use. The current marketing page only claims data is "Updated hourly against 35+
  sources" with no per-field provenance: <https://restcountries.com/>.

### 2.7 Competing published figures (important context — Svalbard's own area is not agreed on)

| figure | what it appears to be | source | URL |
|---|---|---|---|
| **61,022 km²** | Svalbard (SSB/NPI family) | SSB via SNL, Longyearbyen lokalstyre, Nordic Yearbook, Prop. 1 S | see §2.2 |
| **62,045 km²** | Svalbard | CIA World Factbook, as cited on Wikipedia's area list | <https://en.wikipedia.org/wiki/List_of_countries_and_dependencies_by_area> (see also §4 — the CIA World Factbook is **retired**) |
| **377 km²** | Jan Mayen | SNL, NPI, CIA | see §2.3 |
| **61,399 km²** | Svalbard + Jan Mayen (computed sum) | this file; uncited Wikipedia infobox | §2.4 |
| **62,422 km²** | "combined area for Svalbard and Jan Mayen" per **the UN** | cited in a Wikipedia footnote on the area list | same as the area-list URL above |

Note the two "combined" candidates disagree: 61,399 (SSB components summed) vs 62,422 ("the UN"),
the latter presumably built from the CIA-era 62,045 + 377. **I could not verify the UN's 62,422
figure from a primary UN source** — it reached me only as a Wikipedia footnote, and UN M49
(<https://unstats.un.org/unsd/methodology/m49/overview/>) carries **no area field at all**. So 62,422
is *unverified*.

### 2.8 The CIA World Factbook is no longer a citable source

`https://www.cia.gov/the-world-factbook/countries/svalbard-and-jan-mayen/` now resolves to a CIA
farewell notice, *"Spotlighting The World Factbook as We Bid a Fond Farewell"*, dated **February 4,
2026**, stating the World Factbook *"has sunset."* <https://www.cia.gov/the-world-factbook/> (checked
2026-10-04). This matters because the CIA World Factbook is the *documented* upstream for the
Wikipedia area figures (62,045 / 377) and for REST Countries' `area` field. **Any citation we point at
"the CIA World Factbook" is now dead** and must be replaced or dropped.

### 2.9 Verdict on the Svalbard/Jan Mayen `area`

- The bundled **`61399` is not an error in arithmetic.** It is exactly `61,022 + 377`, i.e. the
  correct *combined* total of the two landmasses under the current best authoritative component
  figures (SSB for Svalbard; SNL/NPI/SSB for Jan Mayen).
- It is **misleading if presented as "the area of Svalbard"**, because that would overstate Svalbard
  by 377 km² and silently fold in a separate, separately-administered island that is *not* covered by
  the Svalbard Treaty.
- Its **provenance is unverified**: the project's own documented source for `area` does not contain
  the number, and the canonical open dataset records SJM's area as *unknown* (`-1`).
- Because component figures themselves drift between sources (61,022 vs 62,045), the sum should never
  be presented to 6 significant figures without saying it is a sum.

---

## 3. The other flagged records

I extracted the bundled values (§1.2) but **did not verify their `area` figures against primary
sources** — the task's verification scope was Svalbard/Jan Mayen, and I would rather report nothing
than pad the file with unverified numbers. What I *can* say without any external claim is the
following internal-consistency observations, which are verifiable by reading the file itself:

- **`SGS`** is internally contradictory: `name.common` = "South Georgia" while `name.official` =
  "South Georgia and the South Sandwich Islands". A single `area: 3903` cannot represent both, and
  whether it does or not is **could not verify** here.
- **`ATF`** (`7747`) and **`ATA`** (`14000000`) are the kinds of round figures that typically encode a
  definitional choice (e.g. excluding Antarctic ice shelves / sea) rather than a measurement. I did
  **not** verify either against a primary source.
- **`HMD`** (`412`) bundles two islands into one figure; **`UMI`** (`34.2`, non-integer) bundles
  multiple atolls. Both **could not verify**.
- **`HKG.capital = ["City of Victoria"]`** is a district of Hong Kong, not the de facto capital
  (which is Hong Kong / the Central–Western district cluster). **Could not verify** what REST Countries
  intends; flagging as a likely mislabel rather than asserting a correction.
- **`UNK`** is a non-ISO placeholder for Kosovo, is referenced from `MNE.borders`, and carries
  `independent: null`. Since `UNK` is not a valid ISO 3166-1 alpha-3, anything that looks up border
  partners by code will not find it in a standards table.
- **35 records have no `population` key**, including `SJM`. This is a *missing* value, distinct from a
  wrong one, and any UI that renders "Population: 0" for these is wrong.

---

## 4. Explicitly could-not-verify list

| # | Item | Why |
|---|---|---|
| 1 | REST Countries v5's documented derivation of `SJM.area = 61399` | v3.1 is deprecated; v5 needs a bearer key (not used). Its documented source (Wikipedia area list) has no 61,399 value, and `mledoze/countries` records `-1` (unknown). |
| 2 | ISO 3166-1 official listing of `SJ` / `SJM` / `744` from **iso.org** itself | `https://www.iso.org/iso-3166-country-codes.html` returns **HTTP 403** to automated fetch. Corroborated only indirectly via UN M49 (official UN, mirrors ISO codes) and non-authoritative mirrors. |
| 3 | Norwegian Polar Institute's **current** live page figures | `npolar.no` returns **HTTP 403** on all URL variants tried (`/en/themes/`, `/en/topics/`, `/tema/`, `www.`). NPI's "about 61 020 km²" and "377 km2" were read from an Internet Archive capture (2012) and from the search index respectively. |
| 4 | Norwegian Government Prop. 1 S (2024–2025) quote | `regjeringen.no` returns **HTTP 403**; the "61 022 km2" sentence was seen in the search index of the official PDF. Corroborated independently by SNL and Longyearbyen lokalstyre. |
| 5 | The UN's "combined area for Svalbard and Jan Mayen = **62,422 km²**" | Reached me only as a Wikipedia footnote; UN M49 has no area field. No primary UN source located. |
| 6 | CIA World Factbook's own Svalbard (62,045) and Jan Mayen (377) values | The World Factbook **sunset on 4 February 2026**; live pages no longer serve the data. Only third-party transcriptions (Wikipedia) were readable. |
| 7 | Norwegian Wikipedia's / NPI's exact Jan Mayen vs Svalbard split beyond 61,022 + 377 | Consistent everywhere I could read, but I could not find a *primary* Norwegian government document that prints the combined 61,399 figure itself. |
| 8 | `area` for `GRL`, `ATA`, `ATF`, `BVT`, `HMD`, `SGS`, `IOT`, `COK`, `NFK`, `UMI`, `ASM`, `PRI`, `HKG`, `MNP`, `GUM`, `VGB`, `CYP`, `MNE`, `UNK` | Not verified — out of scope for this pass; reported verbatim only (§1.2). |
| 9 | Why `unMember: true` count is 194 rather than 193 | Not investigated. |
| 10 | "Glacial ice covers 36,502 km² (60%) of Svalbard" | Only found as a Wikipedia figure citing a 2005 book; no primary source checked. |
| 11 | Any `timezones` value for any record | Field is absent from the dataset entirely (§1.4) — nothing to verify. |

---

## 5. Recommendations (recommend only — nothing applied)

| field | recommendation |
|---|---|
| `SJM.area = 61399` | **(b) correct to a labelled 61,399 km² *combined total*, cite the components.** Keep the number but relabel it everywhere in the UI as the combined Svalbard + Jan Mayen total, and cite the two components: Svalbard 61,022 km² — SSB via SNL <https://snl.no/Svalbard> (updated 2026-09-28) and Norwegian Polar Institute "about 61 020 km²" <https://web.archive.org/web/20120219235338/http://www.npolar.no/en/the-arctic/svalbard/index.html>; Jan Mayen 377 km² — SNL <https://snl.no/Jan_Mayen> (updated 2026-08-28). Never present 61,399 as "the area of Svalbard". |
| Svalbard's own area, if we ever want to show it | **(a) keep 61 022 km², cite SSB** (via SNL / Longyearbyen lokalstyre / Nordic Statistical Yearbook). Do **not** use 62,045 (CIA-derived) — its source is retired. |
| `SJM` `timezones` | **(c) cannot verify — do not invent.** The field is absent from the bundle; re-run/extend the sync to actually persist `timezones`, or render nothing. |
| `SJM.population` (absent) | **(c) cannot verify — represent honestly as unknown**, never as 0. If a figure is ever wanted, the honest unit is *Svalbard only* (SNL: 2,914 residents, March 2026 — and that explicitly excludes Jan Mayen's 17 station staff), not "Svalbard and Jan Mayen". |
| `SJM.latlng = [78, 20]` | **(c) cannot verify as a representative point** for a group spanning 74–81°N / 10–35°E. Either drop it for SJM or label it as an approximate group centre; do not present it as a location. |
| `SJM.capital = ["Longyearbyen"]` | **(b) correct the framing, not the value.** Longyearbyen is Svalbard's administrative centre; Jan Mayen has no capital and is administered from Nordland. Present as "administrative centre of Svalbard", not "capital of Svalbard and Jan Mayen". |
| `HKG.capital = ["City of Victoria"]` | **(b) correct** to Hong Kong — but I could not verify the intended authoritative label, so treat "correct to Hong Kong" as needing its own citation check before shipping. |
| `UNK` / `MNE.borders` containing `UNK` | **(b) correct the code handling** to `XK` (user-assigned, **not** ISO 3166-1) and label Kosovo as a user-assigned/exception code rather than presenting `UNK` as an alpha-3. |
| `SGS` name/area mismatch | **(c) cannot verify — represent honestly as unknown** for the combined South Georgia + South Sandwich group, or split into two facts; do not let `3903` silently stand in for both. |
| `ATA` = 14,000,000 and `ATF` = 7,747 | **(c) cannot verify — represent honestly as unknown** rather than publishing a precise-looking number, since the underlying figures encode unstated definitional choices. |
| `HMD` = 412, `UMI` = 34.2 | **(c) cannot verify — represent honestly as unknown** rather than publishing per-country figures for multi-island groupings. |
| Any "CIA World Factbook" citation anywhere in our copy | **(b) replace or remove.** The Factbook sunset on 2026-02-04 (<https://www.cia.gov/the-world-factbook/>). |
| Any claim of "250 countries" | **(b) correct the wording** to "250 records — 194 UN member states plus dependencies", since 250 is the REST Countries record count, not a country count. |
| `timezones` / `flags` / `startOfWeek` absent bundle-wide | **(b) correct the pipeline, not the data** — `scripts/sync-countries.mjs` already normalises these fields; the bundle simply predates that path. Until it is re-run, do not surface these fields. |
| `unMember: true` count of 194 | **(c) cannot verify** — investigate before publishing any "194 UN members" claim. |

### One-line bottom line

`SJM.area = 61399` is arithmetically correct as a **combined** total (`61,022` Svalbard + `377`
Jan Mayen), but it must never be labelled as Svalbard's area — and its own upstream provenance is
undocumented and contradicted by the project's cited source, so the defensible fix is to keep the
number with an explicit "Svalbard + Jan Mayen combined" label plus component citations, not to treat
it as a plain country area.
