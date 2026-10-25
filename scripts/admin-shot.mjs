// Capture de l'administration : node scripts/admin-shot.mjs <outDir> <email> <motDePasse> [width]
import { chromium } from '@playwright/test'
import fs from 'node:fs'

const [, , outDir, email, password, widthArg] = process.argv
const width = Number(widthArg) || 1280
fs.mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width, height: 900 } })
const page = await ctx.newPage()
await page.goto('http://localhost:3010/admin', { waitUntil: 'networkidle', timeout: 180000 })
await page.getByLabel(/e-?mail/i).fill(email)
await page.getByLabel(/mot de passe/i).fill(password)
await page.getByRole('button', { name: /connexion|se connecter/i }).click()
await page.waitForURL(/\/admin(\/)?$/, { timeout: 120000 })
await page.waitForTimeout(2500)
await page.screenshot({ path: `${outDir}/admin_dashboard_${width}.png` })
for (const [name, path] of [
  ['orders', '/admin/collections/orders'],
  ['products', '/admin/collections/products'],
  ['product1', '/admin/collections/products/1'],
]) {
  await page.goto(`http://localhost:3010${path}`, { waitUntil: 'networkidle', timeout: 120000 })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${outDir}/admin_${name}_${width}.png` })
}
console.log('ok')
await browser.close()
