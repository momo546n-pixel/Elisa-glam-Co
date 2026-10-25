// Captures du site public pour le README : node scripts/site-shot.mjs <outDir>
// Nécessite le serveur lancé en local (npm run dev, port 3010).
import { chromium } from '@playwright/test'
import fs from 'node:fs'

const [, , outDir] = process.argv
fs.mkdirSync(outDir, { recursive: true })

const BASE = 'http://localhost:3010'
const hideDevBadge = async (page) => {
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' })
}

const browser = await chromium.launch({ channel: 'msedge' })
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } })
  const page = await ctx.newPage()
  for (const [name, path] of [
    ['accueil', '/'],
    ['collection', '/collections/sandales-femme'],
    ['produit', '/boutique/sandale-teranga'],
  ]) {
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 180000 })
    await page.waitForTimeout(1200)
    await hideDevBadge(page)
    // Défilement complet pour déclencher le chargement différé des images
    await page.evaluate(async () => {
      const step = 700
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y)
        await new Promise((r) => { window.setTimeout(r, 150) })
      }
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(1500)
    // Après l'accueil : onAccepter les cookies pour ne pas masquer les boutons
    const accept = page.getByRole('button', { name: /accepter/i })
    if (name !== 'accueil' && await accept.isVisible().catch(() => false)) {
      await accept.click()
      await page.waitForTimeout(600)
      await hideDevBadge(page)
    }
    if (name === 'accueil') await page.screenshot({ path: `${outDir}/${name}_desktop.png`, fullPage: true })
    else await page.screenshot({ path: `${outDir}/${name}_desktop.png` })
    if (name === 'accueil') {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.waitForTimeout(800)
      await page.screenshot({ path: `${outDir}/accueil_mobile.png` })
      await page.setViewportSize({ width: 1280, height: 860 })
    }
  }
  await ctx.close()
}
await browser.close()
console.log('ok')
