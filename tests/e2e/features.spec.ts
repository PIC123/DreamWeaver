import { expect, test } from '@playwright/test';
import { RIG, alertIn, choose, startStory } from './helpers';

type Call = { path: string; body: Record<string, unknown> };
const callsFor = async (request: import('@playwright/test').APIRequestContext, marker: string) => {
  const calls: Call[] = await (await request.get(`${RIG.openai}/__rig/requests`)).json();
  return calls.filter((c) => JSON.stringify(c.body).includes(marker));
};

test('a reader can create a character, choose a portrait and star in a story', async ({
  page,
  request,
}) => {
  const tag = `${Date.now()}`;
  await page.goto('/characters');
  await page.getByLabel('Name').fill('Pip');
  await page
    .getByLabel('What do they look like?')
    .fill(`A small girl with red curls and a patched green coat ${tag}`);
  await page.getByRole('button', { name: /Paint my character/ }).click();

  // Several portraits to choose from, and the look written up for the illustrator.
  const options = page.getByRole('radio', { name: /Portrait option/ });
  await expect(options).toHaveCount(3);
  const look = page.getByLabel(/How the illustrator will describe them/);
  await expect(look).toHaveValue(
    `Distilled look: A small girl with red curls and a patched green coat ${tag}`,
  );
  await expect(page.getByRole('button', { name: 'Pick a portrait to keep' })).toBeDisabled();

  await options.nth(1).click();
  await expect(options.nth(1)).toBeChecked();
  await page.getByRole('button', { name: /Keep this character/ }).click();

  const saved = page.getByRole('region', { name: 'Saved characters' });
  await expect(saved.getByRole('heading', { name: 'Pip' })).toBeVisible();
  await expect(saved.getByRole('img', { name: 'Portrait of Pip' })).toBeVisible();
  await expect(options).toHaveCount(0);

  // The chosen portrait is kept; the unchosen ones are cleaned up.
  const portraits = await callsFor(request, tag);
  expect(portraits.filter((c) => c.path === '/v1/images/generations')).toHaveLength(3);
  const src = await saved.getByRole('img', { name: 'Portrait of Pip' }).getAttribute('src');
  expect(src).toMatch(/story-images\/characters\/[0-9a-f-]{36}\.webp$/);

  // Start a story as Pip: her look is fixed from the first page.
  const setting = `A cloud harbour ${tag}`;
  await page.goto('/');
  await page.getByLabel('Your character').selectOption({ label: 'Pip' });
  await page.getByLabel('Begin Your Journey').fill(setting);
  await page.getByRole('button', { name: /Enter the Realm/ }).click();
  await expect(page.getByRole('log')).toContainText('Scene 1: the adventure begins');
  await expect(page.getByRole('img', { name: /^Illustration:/ })).toBeVisible();

  await page.getByRole('button', { name: /Journal/ }).click();
  const journal = page.getByRole('dialog', { name: /Journal/ });
  await expect(journal).toContainText('named Pip');
  await expect(journal).toContainText('Distilled look: A small girl with red curls');
  await expect(journal).not.toContainText('yellow raincoat');

  const sceneImage = (await callsFor(request, setting)).find(
    (c) => c.path === '/v1/images/generations',
  )!;
  expect(String(sceneImage.body.prompt)).toContain(
    'The main character: Distilled look: A small girl with red curls',
  );

  // Deleting the character removes it from the shelf.
  await page.goto('/characters');
  page.once('dialog', (dialog) => dialog.accept());
  await saved.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('heading', { name: 'Pip' })).toHaveCount(0);
});

test('the character creator turns away unfriendly descriptions', async ({ page }) => {
  await page.goto('/characters');
  await page.getByLabel('Name').fill('Grim');
  await page
    .getByLabel('What do they look like?')
    .fill('FLAGME a description that is not friendly');
  await page.getByRole('button', { name: /Paint my character/ }).click();
  await expect(alertIn(page)).toContainText('friendly for everyone');
  await expect(page.getByRole('radio')).toHaveCount(0);
});

test('reading level and art style shape the words and the pictures', async ({ page, request }) => {
  const setting = `A tide-pool town ${Date.now()}`;
  await page.goto('/');
  await page.getByLabel('Reading level').selectOption('early');
  await page.getByLabel('Art style').selectOption({ label: 'Pixel art' });
  await page.getByLabel('Begin Your Journey').fill(setting);
  await page.getByRole('button', { name: /Enter the Realm/ }).click();
  await expect(page.getByRole('img', { name: /^Illustration:/ })).toBeVisible();

  const calls = await callsFor(request, setting);
  const narrator = calls.find((c) => c.path === '/v1/chat/completions')!;
  expect((narrator.body.messages as { content: string }[])[0].content).toContain('five to seven');
  const illustrator = calls.find((c) => c.path === '/v1/images/generations')!;
  expect(String(illustrator.body.prompt)).toMatch(/^Detailed 16-bit pixel art/);
});

test('a story can be brought to a close, and then it stays closed', async ({ page }) => {
  const storyId = await startStory(page);
  await expect(page.getByRole('button', { name: /Bring the story to a close/ })).toHaveCount(0);
  await choose(page, /Go north \(1\)/, 2);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: /Bring the story to a close/ }).click();
  await expect(page.getByRole('log')).toContainText(
    'Scene 3: and so the adventure came to a gentle close.',
  );
  await expect(page.getByText('✨ The End ✨')).toBeVisible();
  await expect(page.getByLabel('Describe what you do next')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Go north/ })).toHaveCount(0);
  await expect(page.getByRole('img', { name: /^Illustration: Scene 3/ })).toBeVisible();

  // The server refuses to add to a finished story.
  const status = await page.evaluate(async (id) => {
    const key = Object.keys(localStorage).find((k) => k.endsWith('-auth-token'))!;
    const token = JSON.parse(localStorage.getItem(key)!).access_token as string;
    const res = await fetch(`/api/stories/${id}/turns`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'keep going' }),
    });
    return res.status;
  }, storyId);
  expect(status).toBe(409);

  await page.reload();
  await expect(page.getByText('✨ The End ✨')).toBeVisible();
  await page.getByRole('button', { name: /Book View/ }).click();
  const book = page.getByTestId('book');
  await expect(book).toContainText('came to a gentle close');
  await expect(book.getByText('The End', { exact: true })).toBeVisible();
});

test('a story can be laid out for printing or saving as a PDF', async ({ page }) => {
  const storyId = await startStory(page, 'A paper-lantern festival');
  await choose(page, /Go north \(1\)/, 2);
  await expect(page.getByRole('img', { name: /^Illustration: Scene 2/ })).toBeVisible();

  await page.goto(`/story/${storyId}/print`);
  await expect(page.getByRole('heading', { name: 'A paper-lantern festival' })).toBeVisible();
  await expect(page.getByText('Scene 1: the adventure begins')).toBeVisible();
  await expect(page.getByText('Scene 2: you chose to Go north (1)')).toBeVisible();
  await expect(page.getByRole('img', { name: /Illustration for page/ })).toHaveCount(2);
  const printButton = page.getByRole('button', { name: /Print or save as PDF/ });
  await expect(printButton).toBeVisible();

  // On paper the toolbar disappears and only the book remains.
  await page.emulateMedia({ media: 'print' });
  await expect(printButton).toBeHidden();
  await expect(page.getByText('Scene 2: you chose to Go north (1)')).toBeVisible();
  const pdf = await page.pdf({ format: 'A4' });
  expect(pdf.byteLength).toBeGreaterThan(5000);
});

test('portraits are still painted when the description write-up comes back empty', async ({
  page,
}) => {
  await page.goto('/characters');
  await page.getByLabel('Name').fill('Quill');
  await page
    .getByLabel('What do they look like?')
    .fill('EMPTYLOOK   a tall man with messy brown hair,\nglasses and a green flannel shirt');
  await page.getByRole('button', { name: /Paint my character/ }).click();

  await expect(page.getByRole('radio', { name: /Portrait option/ })).toHaveCount(3);
  // The reader's own words stand in for the look, tidied, and can be edited.
  await expect(page.getByLabel(/How the illustrator will describe them/)).toHaveValue(
    'EMPTYLOOK a tall man with messy brown hair, glasses and a green flannel shirt',
  );
});

test('a busy illustrator is waited for, and portraits still arrive', async ({ page }) => {
  await page.goto('/characters');
  await page.getByLabel('Name').fill('Bram');
  await page
    .getByLabel('What do they look like?')
    .fill(`BUSYIMG a cheerful baker with flour on his apron ${Date.now()}`);
  await page.getByRole('button', { name: /Paint my character/ }).click();

  // The first portrait is turned away once for being busy; the app waits and retries.
  await expect(page.getByText('The illustrator is busy. Trying again in a moment…')).toBeVisible();
  const options = page.getByRole('radio', { name: /Portrait option/ });
  await expect(options).toHaveCount(3);
  await expect(alertIn(page)).toHaveCount(0);

  await options.first().click();
  await page.getByRole('button', { name: /Keep this character/ }).click();
  await expect(page.getByRole('img', { name: 'Portrait of Bram' })).toBeVisible();
});

test('an account that is out of credit is reported as that, not as being busy', async ({
  page,
}) => {
  await page.goto('/characters');
  await page.getByLabel('Name').fill('Odd');
  await page
    .getByLabel('What do they look like?')
    .fill(`QUOTAIMG a lighthouse keeper in a long grey coat ${Date.now()}`);
  await page.getByRole('button', { name: /Paint my character/ }).click();

  const alerts = alertIn(page);
  await expect(alerts).toHaveCount(3);
  await expect(alerts.first()).toContainText('out of credit or has reached its spending limit');
  await expect(page.getByRole('button', { name: 'Try this one again' })).toHaveCount(3);
});

test('a scene is still illustrated when the illustrator is briefly busy', async ({ page }) => {
  await startStory(page, `A marsh of lanterns ${Date.now()}`);
  await page.getByLabel('Describe what you do next').fill('BUSYIMG wade onward');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('img', { name: /^Illustration: Scene 2/ })).toBeVisible();
  await expect(alertIn(page)).toHaveCount(0);
});
