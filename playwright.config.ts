import { defineConfig, devices } from '@playwright/test'

/**
 * Tests de bout en bout du tunnel d'achat (critère de recette n°7).
 * Prérequis : site lancé (npm run dev), base alimentée (npm run seed), PAYMENT_PROVIDER=mock.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3010',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mobile-375', use: { ...devices['Pixel 5'], viewport: { width: 375, height: 812 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
})
