#!/usr/bin/env node
/**
 * build-sitemap.mjs
 *
 * Generates public/sitemap.xml and public/robots.txt.
 *
 * The site base URL may be supplied as:
 *   --site=https://example.com
 *   --site https://example.com
 *   node scripts/build-sitemap.mjs https://example.com
 *   SITE / SITE_URL environment variable
 * A leading `--` (as inserted by `npm run`) is ignored.
 *
 * Emits 202 URLs: `/`, `/world`, `/time-travel`, every country at
 * `/country/:cca3`, plus landmark and nature pages.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const PUBLIC_DIR = path.join(rootDir, 'public');
const ATLAS_FILE = path.join(PUBLIC_DIR, 'data', 'countries-110m.json');
const SITEMAP_FILE = path.join(PUBLIC_DIR, 'sitemap.xml');
const ROBOTS_FILE = path.join(PUBLIC_DIR, 'robots.txt');

const LANDMARKS = [
  'everest',
  'machu-picchu',
  'great-wall',
  'petra',
  'taj-mahal',
  'colosseum',
  'pyramids',
  'christ-redeemer',
  'angkor-wat',
  'stonehenge',
  'acropolis',
  'chichen-itza',
];

const NATURE = [
  'amazon',
  'grand-canyon',
  'niagara-falls',
  'serengeti',
  'galapagos',
  'great-barrier-reef',
  'yellowstone',
  'banff',
  'patagonia',
  'yosemite',
];

/* ------------------------------------------------------------------ */
/* Arguments                                                           */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  let site = '';
  const args = argv.slice(2).filter((a) => a !== '--');

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--site=')) {
      site = arg.slice('--site='.length);
    } else if (arg === '--site') {
      site = args[i + 1] || '';
      i++;
    } else if (!arg.startsWith('-') && !site) {
      // Positional base URL.
      site = arg;
    }
  }

  if (!site) site = process.env.SITE || process.env.SITE_URL || '';
  return normalizeSite(site);
}

function normalizeSite(url) {
  if (!url) return '';
  let u = String(url).trim().replace(/\/+$/, '');
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}

/* ------------------------------------------------------------------ */
/* URL set                                                             */
/* ------------------------------------------------------------------ */

function loadCountryCodes() {
  if (!fs.existsSync(ATLAS_FILE)) return [];
  try {
    const atlas = JSON.parse(fs.readFileSync(ATLAS_FILE, 'utf8'));
    const codes = [];
    const seen = new Set();
    for (const shape of atlas.shapes || []) {
      const code = shape && shape.cca3 ? String(shape.cca3).toUpperCase() : '';
      if (code && !seen.has(code)) {
        seen.add(code);
        codes.push(code);
      }
    }
    return codes;
  } catch (err) {
    console.warn(`Could not read atlas (${ATLAS_FILE}): ${err.message}`);
    return [];
  }
}

function buildUrls(site) {
  const codes = loadCountryCodes();

  // pathname -> { changefreq, priority }
  const pages = new Map();
  const add = (loc, changefreq, priority) => {
    if (!pages.has(loc)) pages.set(loc, { changefreq, priority });
  };

  add('/', 'weekly', '1.0');
  add('/world', 'weekly', '0.9');
  add('/time-travel', 'monthly', '0.6');

  for (const code of codes) add(`/country/${code}`, 'monthly', '0.7');
  for (const slug of LANDMARKS) add(`/landmark/${slug}`, 'monthly', '0.6');
  for (const slug of NATURE) add(`/nature/${slug}`, 'monthly', '0.6');

  const urls = [...pages.entries()].map(([loc, meta]) => ({
    loc: site ? site + loc : loc,
    ...meta,
  }));
  return urls;
}

/* ------------------------------------------------------------------ */
/* Output                                                              */
/* ------------------------------------------------------------------ */

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSitemap(urls) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const u of urls) {
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(u.loc)}</loc>`);
    if (u.changefreq) lines.push(`    <changefreq>${u.changefreq}</changefreq>`);
    if (u.priority) lines.push(`    <priority>${u.priority}</priority>`);
    lines.push('  </url>');
  }
  lines.push('</urlset>');
  return lines.join('\n') + '\n';
}

function generateRobots(site) {
  const lines = ['User-agent: *', 'Allow: /', ''];
  lines.push(`Sitemap: ${site ? site + '/sitemap.xml' : '/sitemap.xml'}`);
  lines.push('');
  return lines.join('\n');
}

function main() {
  const site = parseArgs(process.argv);
  if (!site) {
    console.warn('Warning: no site URL provided; sitemap will use relative <loc> values.');
    console.warn('         Pass --site=https://example.com or set SITE_URL.');
  }

  const urls = buildUrls(site);
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(SITEMAP_FILE, generateSitemap(urls));
  fs.writeFileSync(ROBOTS_FILE, generateRobots(site));

  console.log(`Wrote ${urls.length} URLs to ${SITEMAP_FILE}`);
  console.log(`Wrote ${ROBOTS_FILE}`);
  if (urls.length !== 202) {
    console.warn(`Warning: expected 202 URLs, generated ${urls.length}`);
  }
}

main();
