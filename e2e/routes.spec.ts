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
  await expect(page.locator('a[href="/country/FRA"]')).toBeVisible()

  await page.getByRole('link', { name: 'Landmarks' }).click()
  await page.getByLabel('Wonder list').selectOption('new-seven')
  await expect(page.locator('.catalog-count')).toHaveText('7 results')

  await page.getByRole('link', { name: 'Nature' }).click()
  await page.getByLabel('Filter by type').selectOption('all')
  await expect(page.getByRole('heading', { name: 'Nature' })).toBeVisible()
  await expect(page.locator('.catalog-count')).toHaveText('16 results')
})

test('Explorer Nearby panel reports verified records only, and says so when there are none', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open Explorer' }).click()

  // Default anchor is Marrakech, which has no verified record inside the
  // panel's 3 km window. The app must state that plainly rather than inventing
  // a place to fill the space.
  await page.getByRole('tab', { name: 'Verified places nearby' }).click()
  const panel = page.getByRole('tabpanel')
  await expect(panel.getByText('No verified places in range')).toBeVisible()
  await expect(panel.getByText(/curated set of \d+ landmarks and natural sites/)).toBeVisible()

  // Move to a point that genuinely has a cited record nearby (the Colosseum),
  // and confirm the real record is shown without any "surprise me" prompt.
  await page.getByRole('tab', { name: 'You Are Here' }).click()
  await page.getByRole('tabpanel').getByRole('button', { name: /Rome/ }).click()
  await page.getByRole('tab', { name: 'Verified places nearby' }).click()
  await expect(panel.getByText('Colosseum', { exact: true })).toBeVisible()
  await expect(panel.getByRole('button', { name: /Explore/ })).toBeVisible()

  await panel.getByRole('button', { name: /Explore/ }).click()
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
