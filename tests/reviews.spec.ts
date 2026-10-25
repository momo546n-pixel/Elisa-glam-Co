import { expect, test } from '@playwright/test'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@elisaglam.test'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Test-Local-2026!'

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    try {
      localStorage.setItem('eg-consent', 'denied')
    } catch {
      /* ignoré */
    }
  })
})

test('avis : seuls les acheteurs livrés peuvent publier, après modération', async ({ page, request }) => {
  const comment = `Très belles finitions, test ${Math.random().toString(36).slice(2, 8)}.`
  const phone = `77 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10} 55`

  // 1. Une commande (paiement à la livraison)
  await page.goto('/boutique/sandale-saly')
  await page.locator('[role=radiogroup][aria-labelledby=size-label] button:not([disabled])').first().click()
  await page.getByTestId('add-to-cart').click()
  await page.getByRole('dialog', { name: 'Panier' }).getByRole('link', { name: 'Commander' }).click()
  await page.getByLabel('Nom et prénom').fill('Fatou Avis')
  await page.getByLabel(/Téléphone/).fill(phone)
  await page.getByLabel('Zone de livraison').selectOption({ label: 'Dakar Plateau / Médina' })
  await page.getByLabel('Adresse / quartier').fill('Plateau, Dakar')
  await page.getByTestId('pay-cod').check()
  await page.getByTestId('place-order').click()
  await expect(page).toHaveURL(/\/commande\/confirmation\/EG-/)
  const orderNumber = page.url().match(/EG-[A-Z0-9-]+/)![0]

  // 2. Avant la livraison : refus
  await page.goto('/avis')
  await page.getByLabel('Numéro de commande').fill(orderNumber)
  await page.getByLabel(/Téléphone/).fill(phone)
  await page.getByRole('button', { name: 'Continuer' }).click()
  await expect(page.getByText(/dès que votre commande aura été livrée/)).toBeVisible()

  // 3. L'administratrice marque la commande comme livrée
  const login = await request.post('/api/users/login', { data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
  expect(login.ok()).toBeTruthy()
  const { token } = await login.json()
  const headers = { Authorization: `JWT ${token}` }
  const found = await request.get(`/api/orders?where[orderNumber][equals]=${orderNumber}`, { headers })
  const order = (await found.json()).docs[0]
  const patch = await request.patch(`/api/orders/${order.id}`, { headers, data: { status: 'delivered' } })
  expect(patch.ok()).toBeTruthy()

  // 4. Après la livraison : l'avis est possible
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByLabel('Votre prénom').fill('Fatou')
  await page.getByRole('radio', { name: '5 étoiles' }).click()
  await page.getByLabel('Votre avis').fill(comment)
  await page.getByRole('button', { name: 'Envoyer mon avis' }).click()
  await expect(page.getByTestId('review-success')).toBeVisible()

  // 5. Pas encore visible : modération obligatoire
  await page.goto('/boutique/sandale-saly')
  await expect(page.getByText(comment)).toHaveCount(0)

  // 6. Après approbation par l'administratrice, l'avis apparaît
  const reviews = await request.get(`/api/reviews?where[orderNumber][equals]=${orderNumber}`, { headers })
  const review = (await reviews.json()).docs[0]
  expect(review.status).toBe('pending')
  const approve = await request.patch(`/api/reviews/${review.id}`, { headers, data: { status: 'approved' } })
  expect(approve.ok()).toBeTruthy()
  await page.reload()
  await expect(page.getByText(comment)).toBeVisible()
  await expect(page.getByText('Achat vérifié').first()).toBeVisible()

  // 7. Un second avis sur le même article est refusé
  await page.goto('/avis')
  await page.getByLabel('Numéro de commande').fill(orderNumber)
  await page.getByLabel(/Téléphone/).fill(phone)
  await page.getByRole('button', { name: 'Continuer' }).click()
  await expect(page.getByRole('option', { name: /avis déjà envoyé/ })).toHaveCount(1)
})
