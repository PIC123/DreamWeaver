import { expect, test } from '@playwright/test';
import { RIG, signUp, startStory, uniqueEmail } from './helpers';

test('signing up keeps the stories written as a guest', async ({ page }) => {
  const email = uniqueEmail();
  const storyId = await startStory(page, 'A guest story worth keeping');

  await page.goto('/dashboard');
  await expect(page.getByText('You are exploring as a guest')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'A guest story worth keeping' })).toBeVisible();

  await signUp(page, email);
  await expect(page.getByRole('button', { name: email })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'A guest story worth keeping' })).toBeVisible();
  await expect(page.getByText('You are exploring as a guest')).toBeHidden();

  // The member can carry on writing it.
  await page.goto(`/story/${storyId}`);
  await page.getByRole('button', { name: /Go north \(1\)/ }).click();
  await expect(page.getByRole('log')).toContainText('Scene 2');

  // Signing out leaves a clean guest session; signing back in brings the shelf back.
  await page.goto('/dashboard');
  await page.getByRole('button', { name: email }).click();
  await page.getByRole('menuitem', { name: 'Sign Out' }).click();
  await expect(page.getByRole('heading', { name: 'No Stories Yet' })).toBeVisible();

  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('correct-horse');
  await page.getByRole('dialog').getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'A guest story worth keeping' })).toBeVisible();
  await expect(page.getByText('2 scenes')).toBeVisible();
});

test('deleting a story removes its pictures too', async ({ page, request }) => {
  const storyId = await startStory(page, 'A story to delete');
  const before: string[] = await (await request.get(`${RIG.supabase}/__rig/storage`)).json();
  expect(before.some((key) => key.startsWith(`story-images/${storyId}/`))).toBe(true);

  await page.goto('/dashboard');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('heading', { name: 'No Stories Yet' })).toBeVisible();

  const after: string[] = await (await request.get(`${RIG.supabase}/__rig/storage`)).json();
  expect(after.some((key) => key.startsWith(`story-images/${storyId}/`))).toBe(false);
  await page.goto(`/story/${storyId}`);
  await expect(page.getByRole('heading', { name: "We couldn't find that story" })).toBeVisible();
});

test('the sign-in and sign-up buttons open the form they name', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  await page.getByRole('button', { name: 'Forgot your password?' }).click();
  await expect(page.getByRole('heading', { name: 'Forgot Your Password?' })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Sign Up' }).click();
  await expect(page.getByRole('heading', { name: 'Begin Your Journey' })).toBeVisible();
});

test('the starfield holds still while typing, and the dice suggests a setting', async ({
  page,
}) => {
  await page.goto('/');
  const positions = () =>
    page
      .locator('.star')
      .evaluateAll((stars) => stars.map((s) => (s as HTMLElement).style.cssText).join('|'));
  const before = await positions();
  expect(before.length).toBeGreaterThan(1000);
  await page.getByLabel('Begin Your Journey').fill('Typing a setting');
  expect(await positions()).toBe(before);

  await page.getByRole('button', { name: 'Surprise me with a setting' }).click();
  await expect(page.getByLabel('Begin Your Journey')).toHaveValue(
    'A clockwork garden beneath a paper moon',
  );
});

test('a new member is welcomed with preferences and a nudge to create a character', async ({
  page,
}) => {
  const email = uniqueEmail();
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign Up' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('correct-horse');
  await page.getByRole('button', { name: 'Create Account' }).click();

  const welcome = page.getByRole('dialog', { name: 'Welcome to DreamWeaver' });
  await expect(welcome).toBeVisible();
  await welcome.getByRole('radio', { name: /Little readers/ }).check();
  await welcome.getByLabel('Favourite art style').selectOption({ label: 'Pixel art' });
  await welcome.getByRole('button', { name: 'Save and continue' }).click();

  // Step two: the invitation to create a character, which can be declined.
  const nudge = page.getByRole('dialog', { name: 'Who will you be?' });
  await expect(nudge.getByRole('link', { name: 'Create my character' })).toHaveAttribute(
    'href',
    '/characters',
  );
  await nudge.getByRole('button', { name: 'Maybe later' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // New stories start from those choices, and they survive a reload without asking again.
  await page.goto('/?createNew=1');
  await expect(page.getByLabel('Reading level')).toHaveValue('early');
  await expect(page.getByLabel('Art style')).toHaveValue('pixel');
  await page.reload();
  await expect(page.getByLabel('Reading level')).toHaveValue('early');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // They can be changed later from the account menu.
  await page.getByRole('button', { name: email }).click();
  await page.getByRole('menuitem', { name: 'Preferences' }).click();
  const settings = page.getByRole('dialog', { name: 'Your Preferences' });
  await settings.getByRole('radio', { name: /Confident readers/ }).check();
  await settings.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Reading level')).toHaveValue('advanced');
});

test("a guest's last story choices become their defaults", async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Reading level').selectOption('advanced');
  await page.getByLabel('Art style').selectOption('ink');
  await page.getByLabel('Begin Your Journey').fill('A drowned library');
  await page.getByRole('button', { name: /Enter the Realm/ }).click();
  await page.waitForURL(/\/story\//);

  await page.goto('/');
  await expect(page.getByLabel('Reading level')).toHaveValue('advanced');
  await expect(page.getByLabel('Art style')).toHaveValue('ink');
});
