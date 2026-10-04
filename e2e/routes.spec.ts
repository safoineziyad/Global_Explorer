import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('landing, browse routes, and page metadata are connected', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'See the world from a new perspective.' })).toBeVisible()
  await expect(page).toHaveTitle('Home | Global Explorer')
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Home | Global Explorer')

  await page.getByRole('link', { name: 'Countries', exact: true }).click()
  await expect(page).toHaveURL(/\/directory$/)
  await page.getByLabel('Search countries').fill('France')
  await expect(page.getByRole('link', { name: /France/ })).toHaveAttribute('href', '/country/FRA')

  await page.getByRole('link', { name: 'Landmarks' }).click()
  await page.getByLabel('Wonder list').selectOption('new-seven')
  await expect(page.locator('.catalog-count')).toHaveText('7 results')

  await page.getByRole('link', { name: 'Nature' }).click()
  await page.getByLabel('Filter by type').selectOption('all')
  await expect(page.getByRole('heading', { name: 'Nature' })).toBeVisible()
  await expect(page.locator('.catalog-count')).toHaveText('10 results')
})

test('demo Explore opens the actual generated coordinates on the globe', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open Explorer' }).click()
  await page.getByRole('tab', { name: 'Demo suggestions' }).click()
  await page.getByRole('button', { name: "I'm here. Surprise me." }).click()
  await expect(page.getByRole('tabpanel').getByText('DEMO / SIMULATED DATA', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Explore', exact: true }).click()
  await expect(page).toHaveURL(/\/world\?lat=-?\d+(\.\d+)?&lng=-?\d+(\.\d+)?/)
  await expect(page.locator('canvas')).toBeVisible()
})

test('landing page has no serious axe accessibility violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(results.violations.filter((issue) => issue.impact === 'critical' || issue.impact === 'serious')).toEqual([])
})
