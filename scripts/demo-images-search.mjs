// Recherche de photos libres de droits (Wikimedia Commons) pour le site de démonstration.
// Usage : node scripts/demo-images-search.mjs <dossierSortie> "<requête 1>" "<requête 2>" ...
// Produit, par requête : <slug>.json (métadonnées + licences) et <slug>.jpg (planche-contact numérotée).
import sharp from 'sharp'
import fs from 'node:fs'

const [, , outDir, ...queries] = process.argv
fs.mkdirSync(outDir, { recursive: true })
const UA = { 'User-Agent': 'ElisaGlamDemoSite/1.0 (demonstration; contact: demo@example.com)' }
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
const strip = (h = '') => h.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
const BAD = /museo|museum|egizio|mummy|mummia|tomb|\.tif|egypt|grave|nutrition|bata shoe|sculpture|painting|drawing|map of/i
const OK_LICENSE = /^(cc0|cc by|cc by-sa|public domain|pdm)/i

async function search(q) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6' +
    `&gsrsearch=${encodeURIComponent(q + ' filetype:bitmap')}&gsrlimit=50&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=420`
  const res = await fetch(url, { headers: UA })
  const json = await res.json()
  const pages = Object.values(json.query?.pages ?? {})
  return pages
    .map((p) => {
      const ii = p.imageinfo?.[0]
      if (!ii) return null
      const m = ii.extmetadata ?? {}
      return {
        title: p.title.replace(/^File:/, ''),
        license: m.LicenseShortName?.value ?? '',
        artist: strip(m.Artist?.value ?? '') || 'Auteur inconnu',
        page: ii.descriptionurl,
        url: ii.url,
        thumb: ii.thumburl,
        width: ii.width,
        height: ii.height,
        mime: ii.mime,
      }
    })
    .filter((c) => c && c.mime === 'image/jpeg' && c.width >= 1000 && OK_LICENSE.test(c.license) && !BAD.test(c.title))
}

for (const q of queries) {
  const cands = (await search(q)).slice(0, 24)
  const tiles = []
  for (let i = 0; i < cands.length; i++) {
    try {
      const buf = Buffer.from(await (await fetch(cands[i].thumb, { headers: UA })).arrayBuffer())
      const img = await sharp(buf).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 70 }).toBuffer()
      const label = Buffer.from(
        `<svg width="300" height="300"><rect x="0" y="0" width="46" height="30" fill="#000"/><text x="23" y="22" font-size="20" font-family="Arial" fill="#fff" text-anchor="middle">${i}</text></svg>`,
      )
      tiles.push({ input: await sharp(img).composite([{ input: label }]).toBuffer(), left: (i % 6) * 304, top: Math.floor(i / 6) * 304 })
    } catch {
      tiles.push(null)
    }
  }
  const rows = Math.ceil(cands.length / 6) || 1
  await sharp({ create: { width: 6 * 304, height: rows * 304, channels: 3, background: '#ffffff' } })
    .composite(tiles.filter(Boolean))
    .jpeg({ quality: 72 })
    .toFile(`${outDir}/${slug(q)}.jpg`)
  fs.writeFileSync(`${outDir}/${slug(q)}.json`, JSON.stringify(cands, null, 2))
  console.log(`${q}: ${cands.length} candidats → ${slug(q)}.jpg`)
}
