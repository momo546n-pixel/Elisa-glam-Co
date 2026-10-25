// Capture d'écran pour revue visuelle : node scripts/shot.mjs <outDir> <width> <path> [<path>...]
import { chromium } from '@playwright/test'
import fs from 'node:fs'

const [, , outDir, widthArg, ...paths] = process.argv
const width = Number(widthArg) || 375
const height = width < 768 ? 812 : 900
fs.mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  isMobile: width < 768,
  hasTouch: width < 768,
})
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('eg-consent', 'denied')
  } catch {}
})
if (process.env.WITH_CART) {
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem(
        'eg-cart-v1',
        JSON.stringify([{ key: '3|Noir|40', productId: '3', slug: 'sandale-homme-modele-demo-01', name: 'Sandale homme — modèle démo 01', reference: 'EG-DEMO-SH-01', color: 'Noir', size: '40', unitPrice: 30000, quantity: 1, maxQuantity: 5, image: null }]),
      )
    } catch {}
  })
}
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(`${m.text()}`))
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

for (const p of paths) {
  const res = await page.goto(`http://localhost:3010${p}`, { waitUntil: 'networkidle', timeout: 120000 })
  await page.waitForTimeout(900)
  const name = (p === '/' ? 'home' : p.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')) + `_${width}`
  const total = await page.evaluate(() => document.documentElement.scrollHeight)
  const slice = width < 768 ? 1100 : 1000
  const n = Math.min(Math.ceil(total / slice), Number(process.env.MAX_SLICES || 8))
  for (let i = 0; i < n; i++) {
    await page.screenshot({
      path: `${outDir}/${name}_${i + 1}.png`,
      fullPage: true,
      clip: { x: 0, y: i * slice, width, height: Math.min(slice, total - i * slice) },
    })
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  console.log(`${p} → ${res?.status()} ${name}_1..${n}.png (h=${total}) overflowX=${overflow}`)
}
if (errors.length) console.log('CONSOLE ERRORS:\n' + errors.slice(0, 10).join('\n'))
await browser.close()
