import { expect, test } from '@playwright/test';
import { choose, startStory } from './helpers';

test('the book opens at the newest page, turns, and can continue the story', async ({ page }) => {
  await startStory(page);
  await choose(page, /Go north \(1\)/, 2);

  await page.getByRole('button', { name: /Book View/ }).click();
  const book = page.getByTestId('book');
  await expect(book).toHaveAttribute('data-spread', '2');
  await expect(book).toContainText('Scene 2: you chose to Go north (1)');
  await expect(page.getByText('Page 2 of 2')).toBeVisible();

  await page.getByRole('button', { name: /Previous/ }).click();
  await expect(book).toHaveAttribute('data-spread', '1');
  await expect(book).toContainText('Scene 1: the adventure begins');

  await page.keyboard.press('ArrowLeft');
  await expect(book).toHaveAttribute('data-spread', '0');
  await expect(page.getByText('Cover', { exact: true })).toBeVisible();
  await expect(book.getByRole('heading', { name: 'A haunted lighthouse' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Previous/ })).toBeDisabled();

  // Continue the story from inside the book: a new page is added and turned to.
  await page
    .getByRole('dialog', { name: 'Book view' })
    .getByRole('button', { name: /Wait quietly \(2\)/ })
    .click();
  await expect(book).toContainText('Scene 3: you chose to Wait quietly (2)');
  await expect(book).toHaveAttribute('data-spread', '3');
  await expect(book.getByRole('img', { name: 'Illustration for page 3' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(book).toBeHidden();
});
