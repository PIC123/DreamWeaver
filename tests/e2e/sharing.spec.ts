import { expect, test } from '@playwright/test';
import { startStory } from './helpers';

test('a story is private until its author shares it, and readers cannot change it', async ({
  page,
  browser,
}) => {
  const storyId = await startStory(page);
  const visitorContext = await browser.newContext();
  const visitor = await visitorContext.newPage();

  await visitor.goto(`/story/${storyId}`);
  await expect(visitor.getByRole('heading', { name: "We couldn't find that story" })).toBeVisible();

  await page.getByRole('button', { name: /Share/ }).click();
  const toggle = page.getByLabel('Anyone with the link can read this story');
  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(page.getByLabel('Story link')).toHaveValue(new RegExp(`/story/${storyId}$`));

  await visitor.reload();
  await expect(visitor.getByText('A shared story · read only')).toBeVisible();
  await expect(visitor.getByRole('heading', { name: 'A haunted lighthouse' })).toBeVisible();
  await visitor.getByRole('button', { name: /Next/ }).click();
  await expect(visitor.getByTestId('book')).toContainText('Scene 1: the adventure begins');
  await expect(visitor.getByLabel('Describe what you do next')).toHaveCount(0);
  await expect(visitor.getByRole('link', { name: /Write your own story/ })).toBeVisible();

  // The visitor's own (guest) session cannot write to someone else's story.
  const attempts = await visitor.evaluate(async (id) => {
    const key = Object.keys(localStorage).find((k) => k.endsWith('-auth-token'))!;
    const token = JSON.parse(localStorage.getItem(key)!).access_token as string;
    const call = (path: string, method: string, body?: unknown) =>
      fetch(path, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      }).then((r) => r.status);
    return {
      turn: await call(`/api/stories/${id}/turns`, 'POST', { action: 'steal the story' }),
      unshare: await call(`/api/stories/${id}`, 'PATCH', { isPublic: false }),
      remove: await call(`/api/stories/${id}`, 'DELETE'),
      noToken: await fetch(`/api/stories/${id}/turns`, { method: 'POST', body: '{}' }).then(
        (r) => r.status,
      ),
    };
  }, storyId);
  expect(attempts).toEqual({ turn: 403, unshare: 403, remove: 403, noToken: 401 });

  await toggle.click();
  await expect(page.getByText('Right now only you can open this story.')).toBeVisible();
  await visitor.reload();
  await expect(visitor.getByRole('heading', { name: "We couldn't find that story" })).toBeVisible();
  await visitorContext.close();
});

test('a short id from the original app still opens its story', async ({ page }) => {
  await page.goto('/story/abc123xyz');
  await expect(page).toHaveURL(/\/story\/20000000-0000-0000-0000-000000000001$/);
  await expect(page.getByText('A shared story · read only')).toBeVisible();
  await page.getByRole('button', { name: /Next/ }).click();
  await expect(page.getByTestId('book')).toContainText('You stand at the lighthouse door.');
});

test('shared stories get a link preview; private ones reveal nothing', async ({
  page,
  request,
}) => {
  const shared = await (await request.get('/story/20000000-0000-0000-0000-000000000001')).text();
  expect(shared).toContain('<title>A haunted lighthouse · DreamWeaver</title>');

  const storyId = await startStory(page, 'A secret garden 4471');
  const hidden = await (await request.get(`/story/${storyId}`)).text();
  expect(hidden).not.toContain('secret garden 4471');
});
