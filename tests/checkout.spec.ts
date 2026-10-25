import { expect, test, type Page } from '@playwright/test'

const PRODUCT_URL = '/boutique/sandale-teranga'

/** Téléphones distincts pour chaque test (limitation de commandes par numéro). */
let phoneCounter = Math.floor(Math.random() * 900) + 100
const nextPhone = () => `77 ${String(++phoneCounter).padStart(3, '0')} ${String(Math.floor(Math.random() * 90) + 10)} 00`

test.beforeEach(async ({ context }) => {
  // Pas de bandeau cookies dans le chemin du test
  await context.addInitScript(() => {
    try {
      localStorage.setItem('eg-consent', 'denied')
    } catch {
      /* ignoré */
    }
  })
})

async function addFirstAvailableSizeToCart(page: Page) {
  await page.goto(PRODUCT_URL)
  const addButton = page.getByTestId('add-to-cart')
  await expect(addButton).toBeVisible()

  // 1. La pointure est obligatoire
  await addButton.click()
  await expect(page.getByRole('alert').filter({ hasText: 'pointure' })).toBeVisible()

  // 2. Les tailles indisponibles sont désactivées : on prend la première disponible
  const size = page.locator('[role=radiogroup][aria-labelledby=size-label] button:not([disabled])').first()
  await size.click()
  await addButton.click()

  // 3. Le tiroir du panier s'ouvre
  await expect(page.getByRole('dialog', { name: 'Panier' })).toBeVisible()
}

async function fillCheckout(page: Page, opts: { zone: string; method: 'wave' | 'cod' }) {
  await page.getByRole('dialog', { name: 'Panier' }).getByRole('link', { name: 'Commander' }).click()
  await expect(page).toHaveURL(/\/commande$/)

  await page.getByLabel('Nom et prénom').fill('Awa Test')
  await page.getByLabel(/Téléphone/).fill(nextPhone())
  await page.getByLabel('Zone de livraison').selectOption({ label: opts.zone })
  await page.getByLabel('Adresse / quartier').fill('Médina, rue 11 x 12, Dakar')

  // Les frais de livraison sont calculés par le serveur
  await expect(page.getByTestId('totals')).toContainText('FCFA')
  await page.getByTestId(`pay-${opts.method}`).check()
}

test.describe('Tunnel d’achat', () => {
  test('commande payée en ligne (paiement simulé) puis suivi', async ({ page }) => {
    await addFirstAvailableSizeToCart(page)
    await fillCheckout(page, { zone: 'Dakar Plateau / Médina', method: 'wave' })

    const phone = await page.getByLabel(/Téléphone/).inputValue()
    await page.getByTestId('place-order').click()

    // Redirection vers la page de paiement simulée
    await expect(page).toHaveURL(/\/paiement\/simulation/)
    await page.getByTestId('sim-success').click()

    await expect(page).toHaveURL(/\/commande\/confirmation\/EG-/)
    await expect(page.getByTestId('confirmation-title')).toContainText('Paiement confirmé')

    // Le panier est vidé après confirmation
    const orderNumber = page.url().match(/EG-[A-Z0-9-]+/)![0]
    await page.goto('/panier')
    await expect(page.getByText('Votre panier est vide')).toBeVisible()

    // Suivi de commande : numéro + téléphone
    await page.goto('/suivi-commande')
    await page.getByLabel('Numéro de commande').fill(orderNumber)
    await page.getByLabel('Téléphone').fill(phone)
    await page.getByRole('button', { name: 'Suivre ma commande' }).click()
    await expect(page.getByTestId('track-result')).toContainText(orderNumber)
    await expect(page.getByTestId('track-result')).toContainText('Payée')

    // Mauvais téléphone : aucune information divulguée
    await page.getByLabel('Téléphone').fill('78 000 00 00')
    await page.getByRole('button', { name: 'Suivre ma commande' }).click()
    await expect(page.getByText(/Aucune commande ne correspond/)).toBeVisible()
  })

  test('paiement à la livraison', async ({ page }) => {
    await addFirstAvailableSizeToCart(page)
    await fillCheckout(page, { zone: 'Dakar Plateau / Médina', method: 'cod' })
    await page.getByTestId('place-order').click()

    await expect(page).toHaveURL(/\/commande\/confirmation\/EG-/)
    await expect(page.getByTestId('confirmation-title')).toContainText('Commande reçue')
    await expect(page.getByText('Vous réglerez à la livraison')).toBeVisible()
  })

  test('le paiement à la livraison est indisponible hors des zones autorisées', async ({ page }) => {
    await addFirstAvailableSizeToCart(page)
    await page.getByRole('dialog', { name: 'Panier' }).getByRole('link', { name: 'Commander' }).click()
    await page.getByLabel('Zone de livraison').selectOption({ label: 'Autres régions du Sénégal' })
    await expect(page.getByTestId('pay-wave')).toBeVisible()
    await expect(page.getByTestId('pay-cod')).toHaveCount(0)
  })

  test('validation du formulaire : téléphone invalide', async ({ page }) => {
    await addFirstAvailableSizeToCart(page)
    await page.getByRole('dialog', { name: 'Panier' }).getByRole('link', { name: 'Commander' }).click()
    await page.getByLabel('Nom et prénom').fill('Awa Test')
    await page.getByLabel(/Téléphone/).fill('12345')
    await page.getByLabel('Zone de livraison').selectOption({ label: 'Dakar Plateau / Médina' })
    await page.getByLabel('Adresse / quartier').fill('Médina, Dakar')
    await page.getByTestId('pay-cod').check()
    await page.getByTestId('place-order').click()
    await expect(page.getByText('Numéro invalide')).toBeVisible()
  })

  test('« Acheter maintenant » mène directement à la commande', async ({ page }) => {
    await page.goto(PRODUCT_URL)
    await page.locator('[role=radiogroup][aria-labelledby=size-label] button:not([disabled])').first().click()
    await page.getByTestId('buy-now').click()
    await expect(page).toHaveURL(/\/commande$/)
  })
})

test.describe('Navigation et mobile', () => {
  test('aucun défilement horizontal sur les pages clés', async ({ page }) => {
    for (const path of ['/', '/boutique', PRODUCT_URL, '/panier', '/faq', '/guide-des-pointures', '/contact']) {
      await page.goto(path)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, `défilement horizontal sur ${path}`).toBeLessThanOrEqual(0)
    }
  })

  test('aucun traceur avant consentement', async ({ page, context }) => {
    await context.clearCookies()
    await page.addInitScript(() => localStorage.removeItem('eg-consent'))
    const requests: string[] = []
    page.on('request', (r) => requests.push(r.url()))
    await page.goto('/')
    await expect(page.getByRole('dialog', { name: 'Gestion des cookies' })).toBeVisible()
    expect(requests.filter((u) => /googletagmanager|facebook\.net|connect\.facebook/.test(u))).toHaveLength(0)
  })

  test('filtre par pointure sur la boutique', async ({ page }) => {
    await page.goto('/boutique?pointure=44')
    await expect(page.getByRole('heading', { name: 'La boutique' })).toBeVisible()
    // Seuls les modèles avec la pointure 44 disponible sont listés (les sandales femme s'arrêtent à 41)
    await expect(page.getByRole('heading', { name: 'Sandale Baobab' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sandale Teranga' })).toHaveCount(0)
  })
})
