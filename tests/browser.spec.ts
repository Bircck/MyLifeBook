import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const storyPath = '/lives/ellen-falk/stories/the-long-way-home/';
const albumPath = '/lives/ellen-falk/album/';
const collectionPath = '/lives/ellen-falk/collection/';
const printPath = '/lives/ellen-falk/print/';

async function decodedImages(page: Page) {
  const images = page.locator('main img');
  expect(await images.count()).toBeGreaterThan(0);
  for (const img of await images.all()) {
    if (!(await img.isVisible())) continue;
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0), {
      message: `Image must load and decode: ${await img.getAttribute('src')}`,
    }).toBe(true);
    await img.evaluate((element: HTMLImageElement) => element.decode());
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function screenshot(page: Page, filename: string) {
  await decodedImages(page);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `artifacts/screenshots/${filename}.png`, fullPage: true });
}

async function noHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document, JSON.stringify(widths)).toBeLessThanOrEqual(widths.viewport + 1);
  expect(widths.body, JSON.stringify(widths)).toBeLessThanOrEqual(widths.viewport + 1);
}

test('desktop memoir loads its photographs and offers a readable story and return path', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Ellen Falk' })).toBeVisible();
  await screenshot(page, 'home-desktop');
  await page.getByRole('link', { name: 'Begin with a story' }).click();
  await expect(page).toHaveURL(new RegExp(`${storyPath}$`));
  await expect(page.getByRole('heading', { level: 1, name: 'The long way home' })).toBeVisible();
  await expect(page.locator('.story-body')).toContainText('potatoes needed shelter too');
  await screenshot(page, 'story-desktop');
  await page.getByRole('link', { name: /All of Ellen's stories/ }).click();
  await expect(page).toHaveURL(/\/lives\/ellen-falk\/#stories$/);
  await expect(page.getByRole('heading', { name: 'The things we remember.' })).toBeVisible();
});

test('search finds words from story prose and Escape restores keyboard focus', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Search stories' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Find a little story' });
  const input = dialog.getByRole('searchbox');
  await expect(input).toBeFocused();
  await input.fill('POTATOES');
  await expect(dialog.locator('[data-search-item]:visible')).toHaveCount(1);
  await expect(dialog.getByRole('link', { name: /The long way home/ })).toBeVisible();
  await expect(dialog.locator('.search-count')).toHaveText('1 story found.');
  await input.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await input.fill('a phrase with no matching memory');
  await expect(dialog.locator('[data-search-item]:visible')).toHaveCount(0);
  await expect(dialog.locator('.search-count')).toHaveText('0 stories found.');
  await input.fill('potatoes');
  await dialog.getByRole('link', { name: /The long way home/ }).click();
  await expect(page).toHaveURL(new RegExp(`${storyPath}$`));
  await expect(page.locator('.story-body')).toContainText('potatoes needed shelter too');
});

test('photo album leads to the same story manuscript', async ({ page }) => {
  await page.goto(albumPath);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Little windows');
  await screenshot(page, 'album-desktop');
  await page.getByRole('link', { name: /The mending basket/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'The mending basket' })).toBeVisible();
  await expect(page.locator('.story-body')).toContainText('buttons in a biscuit tin');
});

test('choosing and rearranging stories preserves the selected order in print', async ({ page }) => {
  await page.goto(collectionPath);
  await expect(page.getByRole('checkbox')).toHaveCount(5);
  await page.getByRole('checkbox', { name: 'A table for everyone' }).uncheck();
  await page.getByRole('checkbox', { name: 'Postcards from elsewhere' }).uncheck();
  const moveGarden = page.getByRole('button', { name: 'Move What the garden knows earlier' });
  for (let step = 0; step < 4; step++) await moveGarden.click();
  await expect(moveGarden).toBeDisabled();
  await expect(page.locator('.selection-status')).toHaveText('3 stories in your book');
  const chosen = ['what-the-garden-knows', 'the-long-way-home', 'the-mending-basket'];
  const preview = page.getByRole('link', { name: 'Open print preview' });
  expect(new URL((await preview.getAttribute('href'))!, 'http://localhost').searchParams.get('stories')).toBe(chosen.join(','));
  await screenshot(page, 'collection-desktop');
  await preview.click();
  await expect(page).toHaveURL(/\/print\/\?stories=/);
  await expect(page.locator('[data-print-id]:visible')).toHaveCount(3);
  expect(await page.locator('[data-print-id]:visible').evaluateAll(elements => elements.map(element => (element as HTMLElement).dataset.printId))).toEqual(chosen);
  expect(await page.locator('[data-contents-id]:visible').evaluateAll(elements => elements.map(element => (element as HTMLElement).dataset.contentsId))).toEqual(chosen);
  await expect(page.getByRole('button', { name: 'Print this book' })).toBeEnabled();
});

test('a shared selection link restores checked stories and their order', async ({ page }) => {
  const chosen = ['the-mending-basket', 'the-long-way-home'];
  await page.goto(`${collectionPath}?stories=${chosen.join(',')}`);
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(2);
  await expect(page.locator('.selection-status')).toHaveText('2 stories in your book');
  const preview = page.getByRole('link', { name: 'Open print preview' });
  expect(new URL((await preview.getAttribute('href'))!, 'http://localhost').searchParams.get('stories')).toBe(chosen.join(','));
});

test('an empty collection cannot be printed or copied', async ({ page }) => {
  await page.goto(`${collectionPath}?stories=`);
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(0);
  const preview = page.getByRole('link', { name: 'Open print preview' });
  await expect(preview).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByRole('button', { name: 'Copy selection link' })).toBeDisabled();
  // Keyboard activation must remain safe even though the control is an anchor.
  await preview.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/collection\/\?stories=$/);
  await expect(page.locator('.collection-message')).toContainText('Choose at least one story');
  await page.getByRole('button', { name: 'Select all', exact: true }).click();
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(5);
  await expect(preview).toHaveAttribute('aria-disabled', 'false');
});

test('unavailable print IDs are reported and never silently replaced by every story', async ({ page }) => {
  await page.goto(`${printPath}?stories=a-letter-kept,does-not-exist`);
  await expect(page.locator('[data-print-id]:visible')).toHaveCount(0);
  await expect(page.locator('.print-warning')).toContainText('No available stories were selected');
  await expect(page.getByRole('button', { name: 'Print this book' })).toBeDisabled();
  await expect(page.locator('body')).not.toContainText('MYLIFEBOOK_PRIVATE_STORY_CANARY');

  await page.goto(`${printPath}?stories=the-long-way-home,does-not-exist,the-long-way-home`);
  await expect(page.locator('[data-print-id]:visible')).toHaveCount(1);
  await expect(page.locator('.print-warning')).toContainText('Some requested stories are not in this edition');
  await expect(page.locator('[data-print-id]:visible h2')).toHaveText('The long way home');
  await expect(page.getByRole('button', { name: 'Print this book' })).toBeEnabled();
});

for (const width of [390, 320]) {
  test(`${width}px reading pages fit the viewport and images decode`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const pages = ['/', storyPath, albumPath, collectionPath, '/lives/', '/lives/milo-chen/', '/lives/noor-rahman/', '/lives/sam-rivera/', '/about/'];
    for (const path of pages) {
      await test.step(path, async () => {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        if (await page.locator('main img').count()) await decodedImages(page);
        await noHorizontalOverflow(page);
        if (path === '/' && width === 390) await screenshot(page, 'home-mobile');
      });
    }
  });
}

for (const [name, path] of Object.entries({ home: '/', story: storyPath, collection: collectionPath, album: albumPath })) {
  test(`${name} has no serious or critical WCAG A/AA accessibility violations`, async ({ page }, testInfo) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const violations = results.violations.filter(violation => violation.impact === 'serious' || violation.impact === 'critical');
    if (violations.length) await testInfo.attach('accessibility-violations', { body: JSON.stringify(violations, null, 2), contentType: 'application/json' });
    const summary = violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      elements: violation.nodes.map(node => node.target),
    }));
    expect(summary).toEqual([]);
  });
}

for (const [id, name, theme] of [
  ['milo-chen', 'Milo Chen', 'playful'],
  ['noor-rahman', 'Noor Rahman', 'electric'],
  ['sam-rivera', 'Sam Rivera', 'warm'],
]) {
  test(`${name} has an individual profile and working story link`, async ({ page }) => {
    await page.goto('/lives/');
    await page.getByRole('link', { name: new RegExp(name) }).click();
    await expect(page).toHaveURL(new RegExp(`/lives/${id}/$`));
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('.story-card')).toHaveCount(3);
    await page.getByRole('link', { name: 'Begin with a story' }).click();
    await expect(page).toHaveURL(new RegExp(`/lives/${id}/stories/`));
    await expect(page.locator('.story-body')).not.toBeEmpty();
  });
}
