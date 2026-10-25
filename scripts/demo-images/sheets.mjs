// Planches-contact des candidats Unsplash : node scripts/demo-images/sheets.mjs <dossierSortie> [groupe...]
import sharp from 'sharp'
import fs from 'node:fs'

const [, , outDir, ...only] = process.argv
fs.mkdirSync(outDir, { recursive: true })
const groups = JSON.parse(fs.readFileSync(new URL('./unsplash-candidates.json', import.meta.url), 'utf8'))
const UA = { 'User-Agent': 'Mozilla/5.0' }

for (const [name, ids] of Object.entries(groups)) {
  if (only.length && !only.includes(name)) continue
  const tiles = []
  for (let i = 0; i < ids.length; i++) {
    try {
      const res = await fetch(`https://images.unsplash.com/photo-${ids[i]}?w=300&h=300&fit=crop&q=60&auto=format`, { headers: UA })
      const buf = Buffer.from(await res.arrayBuffer())
      const label = Buffer.from(`<svg width="300" height="300"><rect width="46" height="30" fill="#000"/><text x="23" y="22" font-size="20" font-family="Arial" fill="#fff" text-anchor="middle">${i}</text></svg>`)
      tiles.push({ input: await sharp(buf).resize(300, 300).composite([{ input: label }]).toBuffer(), left: (i % 5) * 304, top: Math.floor(i / 5) * 304 })
    } catch (e) {
      console.log('échec', name, i, e.message)
    }
  }
  await sharp({ create: { width: 5 * 304, height: Math.ceil(ids.length / 5) * 304, channels: 3, background: '#fff' } })
    .composite(tiles)
    .jpeg({ quality: 70 })
    .toFile(`${outDir}/${name}.jpg`)
  console.log('ok', name)
}
