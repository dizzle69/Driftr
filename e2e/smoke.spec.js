import { test, expect } from '@playwright/test'

test.describe('Driftr smoke', () => {
  test('landing loads and navigates to /app', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
    await expect(page.getByTestId('cta-open-app')).toBeVisible()
    await page.getByTestId('cta-open-app').click()
    await expect(page).toHaveURL(/\/app$/)
  })

  test('demo mode shows dashboard', async ({ page }) => {
    await page.goto('/app')
    await expect(page.getByTestId('btn-demo-data')).toBeVisible({ timeout: 60_000 })
    await page.getByTestId('btn-demo-data').click()
    await expect(page.getByTestId('dashboard-heading')).toBeVisible()
    await expect(page.getByText(/demo data/i)).toBeVisible()
  })

  test('legal pages render', async ({ page }) => {
    await page.goto('/impressum')
    await expect(page.getByRole('heading', { level: 1, name: /Imprint/i })).toBeVisible()
    await page.goto('/datenschutz')
    await expect(
      page.getByRole('heading', { level: 1, name: /Privacy Policy/i })
    ).toBeVisible()
  })
})
