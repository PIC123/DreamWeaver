import { expect, type Page } from '@playwright/test';

export const RIG = {
  openai: 'http://127.0.0.1:54322',
  supabase: 'http://127.0.0.1:54321',
};

/** Creates a story from the landing page and waits for its opening scene and picture. */
export async function startStory(page: Page, setting = 'A haunted lighthouse') {
  await page.goto('/');
  await page.getByLabel('Begin Your Journey').fill(setting);
  await page.getByRole('button', { name: /Enter the Realm/ }).click();
  await page.waitForURL(/\/story\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('log')).toContainText('Scene 1: the adventure begins');
  await expect(page.getByRole('img', { name: /^Illustration:/ })).toBeVisible();
  return page.url().split('/').pop()!;
}

/** Clicks one of the suggested choices and waits for the scene it leads to. */
export async function choose(page: Page, choice: RegExp, expectScene: number) {
  await page.getByRole('button', { name: choice }).click();
  await expect(page.getByRole('log')).toContainText(`Scene ${expectScene}: you chose`);
}

export const uniqueEmail = () =>
  `reader-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

export async function signUp(page: Page, email: string, password = 'correct-horse') {
  await page.getByRole('button', { name: 'Sign Up' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create Account' }).click();
}

/** The app's own alert message (Next.js adds an empty route announcer with the same role). */
export const alertIn = (page: Page) =>
  page.locator('[role="alert"]:not(#__next-route-announcer__)');
