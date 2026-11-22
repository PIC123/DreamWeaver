import { expect, test } from '@playwright/test';
import { RIG, alertIn, choose, startStory } from './helpers';

test('a guest can write, illustrate and reload a story', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  const storyId = await startStory(page);
  await choose(page, /Go north \(1\)/, 2);
  await page.getByLabel('Describe what you do next').fill('open the door');
  await page.getByRole('button', { name: 'Send' }).click();
  const log = page.getByRole('log');
  await expect(log).toContainText('Scene 3: you chose to open the door');

  // Exactly what happened, once each, in order: no duplicates, no stuck loading bubble.
  await expect(log.locator('p')).toHaveText([
    /^Scene 1: the adventure begins\. A sign reads "Welcome, traveller" ✨\nThe path forks ahead\.$/,
    'Go north (1)',
    /^Scene 2: you chose to Go north \(1\)\./,
    'open the door',
    /^Scene 3: you chose to open the door\./,
  ]);
  await expect(log).not.toContainText('Weaving');

  // One illustration per scene, each stored under its own scene.
  const thumbs = page.getByRole('button', { name: /^Show scene/ });
  await expect(thumbs).toHaveCount(3);
  await expect(thumbs.locator('img')).toHaveCount(3);
  const stored: string[] = await (await request.get(`${RIG.supabase}/__rig/storage`)).json();
  expect(stored.filter((key) => key.startsWith(`story-images/${storyId}/`))).toHaveLength(3);

  // Everything survives a reload, read back through row level security.
  await page.reload();
  await expect(log.locator('p')).toHaveCount(5);
  await expect(page.getByRole('img', { name: /^Illustration:/ })).toBeVisible();

  expect(errors).toEqual([]);
});

test('the server, not the browser, decides what the model is asked', async ({ page, request }) => {
  await startStory(page, 'A unique moonlit orchard 7731');
  const calls: { path: string; body: Record<string, unknown> }[] = await (
    await request.get(`${RIG.openai}/__rig/requests`)
  ).json();

  const chat = calls.find(
    (c) =>
      c.path === '/v1/chat/completions' && JSON.stringify(c.body).includes('moonlit orchard 7731'),
  )!;
  const messages = chat.body.messages as { role: string; content: string }[];
  expect(messages[0].role).toBe('system');
  expect(messages[0].content).toContain('narrator of an interactive illustrated storybook');
  expect(chat.body.response_format).toMatchObject({ type: 'json_schema' });

  const image = calls.find(
    (c) =>
      c.path === '/v1/images/generations' && String(c.body.prompt).includes('moonlit orchard 7731'),
  )!;
  expect(image.body).toMatchObject({
    model: 'gpt-image-2.6-flare',
    quality: 'low',
    size: '1024x1024',
    output_format: 'webp',
  });
  expect(String(image.body.prompt)).toContain('Watercolor storybook illustration');
});

test('a failed illustration can be painted again', async ({ page }) => {
  // A unique setting: the rig refuses each distinct image prompt only once.
  await startStory(page, `A stormy harbour ${Date.now()}`);
  await page.getByLabel('Describe what you do next').fill('FAILIMG now');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('log')).toContainText('Scene 2');

  await expect(alertIn(page)).toContainText("couldn't paint this scene");
  await page.getByRole('button', { name: /Paint it/ }).click();
  await expect(page.getByRole('img', { name: /^Illustration: Scene 2/ })).toBeVisible();
});

test('a storyteller failure is reported and the story can continue', async ({ page }) => {
  await startStory(page);
  await page.getByLabel('Describe what you do next').fill('FAILTURN');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(alertIn(page)).toContainText('lost the thread');
  await expect(page.getByRole('log').locator('p')).toHaveCount(1);

  await choose(page, /Look around \(1\)/, 2);
  await expect(page.getByRole('log').locator('p')).toHaveCount(3);
});

test('unfriendly input is turned away', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Begin Your Journey').fill('FLAGME please');
  await page.getByRole('button', { name: /Enter the Realm/ }).click();
  await expect(alertIn(page)).toContainText('friendly for everyone');
  await expect(page).toHaveURL('/');
});

test('guests have a daily limit', async ({ page }) => {
  await startStory(page); // turn 1 of 6
  for (let scene = 2; scene <= 6; scene++)
    await choose(page, new RegExp(`Go north \\(${scene - 1}\\)`), scene);
  await page.getByRole('button', { name: /Go north \(6\)/ }).click();
  await expect(alertIn(page)).toContainText("today's limit for guests");
  await expect(page.getByRole('log')).not.toContainText('Scene 7');
});

test('the previous picture stays, glowing, until the next one materialises over it', async ({
  page,
}) => {
  await startStory(page);
  const art = page.getByRole('region', { name: 'Illustrations' });

  // Hold the next illustration back so the waiting state can be observed.
  let release = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/api/stories/*/scenes/*/image', async (route) => {
    await held;
    await route.continue();
  });

  await choose(page, /Go north \(1\)/, 2);
  await expect(art.getByRole('status')).toHaveText(/Painting the next scene/);
  // Scene 1's picture is still on screen, but is no longer announced as this scene's illustration.
  await expect(art.locator('img').first()).toBeVisible();
  await expect(art.getByRole('img', { name: /^Illustration:/ })).toHaveCount(0);

  release();
  await expect(art.getByRole('img', { name: /^Illustration: Scene 2/ })).toBeVisible();
  await expect(art.getByRole('status')).toHaveCount(0);
  // The old picture remains underneath while the new one appears over it.
  await expect(art.locator('img[aria-hidden="true"]')).toHaveCount(1);
});
