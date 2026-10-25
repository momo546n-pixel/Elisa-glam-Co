// Poids des pages (octets transférés par type) : node scripts/page-weight.mjs <baseUrl> <path> [<path>...]
import { chromium } from '@playwright/test'

const [, , base, ...paths] = process.argv
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true })
await ctx.addInitScript(() => localStorage.setItem('eg-consent', 'denied'))
for (const p of paths) {
  const page = await ctx.newPage()
  const sizes = {}
  page.on('response', async (res) => {
    try {
      const type = (res.headers()['content-type'] || 'other').split(';')[0]
      const len = Number(res.headers()['content-length']) || (await res.body()).length
      const k = type.includes('javascript') ? 'js' : type.includes('css') ? 'css' : type.includes('image') ? 'image' : type.includes('font') ? 'font' : type.includes('html') ? 'html' : 'other'
      sizes[k] = (sizes[k] || 0) + len
    } catch {
      /* ignoré */
    }
  })
  const t0 = Date.now()
  await page.goto(base + p, { waitUntil: 'networkidle' })
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0]
    const paint = Object.fromEntries(performance.getEntriesByType('paint').map((e) => [e.name, Math.round(e.startTime)]))
    return { ttfb: Math.round(nav.responseStart), dcl: Math.round(nav.domContentLoadedEventEnd), fcp: paint['first-contentful-paint'] }
  })
  const kb = Object.fromEntries(Object.entries(sizes).map(([k, v]) => [k, Math.round(v / 1024) + ' Ko']))
  console.log(p, JSON.stringify(kb), JSON.stringify(timing), `${Date.now() - t0}ms`)
  await page.close()
}
await browser.close()
