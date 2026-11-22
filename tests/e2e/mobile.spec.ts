import { expect, test } from '@playwright/test';
import { choose, startStory } from './helpers';

const noSidewaysScroll = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test('the story and the book fit a phone screen', async ({ page }) => {
  // Narrower than the default test phone: the header must wrap, not spill.
  await page.setViewportSize({ width: 360, height: 780 });
  await startStory(page);
  await choose(page, /Go north \(1\)/, 2);
  expect(await noSidewaysScroll(page)).toBe(true);

  // The illustration keeps its shape instead of collapsing to a strip.
  const art = await page.getByRole('img', { name: /^Illustration:/ }).boundingBox();
  expect(art!.width).toBeGreaterThan(250);
  expect(Math.abs(art!.width - art!.height)).toBeLessThan(2);
  await expect(page.getByLabel('Describe what you do next')).toBeInViewport();

  await page.getByRole('button', { name: /Book View/ }).click();
  const book = page.getByTestId('book');
  await expect(book).toContainText('Scene 2');
  expect(await noSidewaysScroll(page)).toBe(true);
  await page.getByRole('button', { name: /Previous/ }).click();
  await expect(book).toContainText('Scene 1');
  await expect(book).not.toContainText('Scene 2');
});
