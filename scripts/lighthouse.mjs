// Audit Lighthouse mobile : node scripts/lighthouse.mjs <outDir> <url> [<url>...]
// Utilise le Chromium de Playwright (déjà installé pour les tests) et le CLI Lighthouse via npx.
import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const [, , outDir, ...urls] = process.argv
fs.mkdirSync(outDir, { recursive: true })
const port = 9333

const browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`] })
try {
  for (const url of urls) {
    const out = `${outDir}/lh_${url.replace(/[^a-z0-9]+/gi, '_')}.json`
    execFileSync(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['--yes', 'lighthouse@12', url, `--port=${port}`, '--only-categories=performance,accessibility,best-practices,seo', '--output=json', `--output-path=${out}`, '--quiet'],
      { stdio: 'inherit', shell: process.platform === 'win32' },
    )
    const r = JSON.parse(fs.readFileSync(out, 'utf8'))
    const scores = Object.entries(r.categories).map(([k, v]) => `${k}:${Math.round(v.score * 100)}`).join(' ')
    const a = r.audits
    console.log(`${url}\n  ${scores}\n  LCP ${a['largest-contentful-paint'].displayValue} · CLS ${a['cumulative-layout-shift'].displayValue} · TBT ${a['total-blocking-time'].displayValue}`)
  }
} finally {
  await browser.close()
}
