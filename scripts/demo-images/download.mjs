// Télécharge et optimise les photos de démonstration listées dans manifest.json
// vers demo-assets/ (1 600 px max, JPEG qualité 80). Usage : node scripts/demo-images/download.mjs
import sharp from 'sharp'
import fs from 'node:fs'

const manifest = JSON.parse(fs.readFileSync(new URL('./manifest.json', import.meta.url), 'utf8'))
const outDir = new URL('../../demo-assets/', import.meta.url)
fs.mkdirSync(outDir, { recursive: true })

const cache = new Map()
for (const [key, id] of Object.entries(manifest.images)) {
  const dest = new URL(`${key}.jpg`, outDir)
  if (fs.existsSync(dest)) continue
  if (cache.has(id)) {
    fs.copyFileSync(cache.get(id), dest)
    continue
  }
  const res = await fetch(`https://images.unsplash.com/photo-${id}?w=1600&q=85&fm=jpg&fit=max`, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) {
    console.log('ÉCHEC', key, id, res.status)
    continue
  }
  const buf = Buffer.from(await res.arrayBuffer())
  await sharp(buf).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(dest.pathname.replace(/^\/([A-Za-z]:)/, '$1'))
  cache.set(id, dest.pathname.replace(/^\/([A-Za-z]:)/, '$1'))
  console.log('ok', key)
}
