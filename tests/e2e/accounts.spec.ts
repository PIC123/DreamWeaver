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
