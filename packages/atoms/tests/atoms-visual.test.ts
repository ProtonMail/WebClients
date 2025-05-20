import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function getStorybooIds() {
    const storybookStaticFolder = resolve(__dirname, '../storybook-static');

    if (!existsSync(storybookStaticFolder)) {
        throw new Error('storybook-static folder does not exist, try to run "yarn storybook:build" first.');
    }

    const content = readFileSync(resolve(storybookStaticFolder, './index.json'), 'utf-8');
    let parsedContent;

    try {
        parsedContent = JSON.parse(content);
    } catch (err) {
        throw new Error('Storybook index.json is not valid JSON.');
    }

    const ids = Object.keys(parsedContent.entries).filter(
        (id: string) => parsedContent.entries[id].type.toLowerCase() === 'story'
    );

    return ids;
}

const ids = getStorybooIds();

test.describe('visual tests', () => {
    for (const id of ids) {
        // NOTE: this is necessary otherwise the snapshot file name will be invalid
        const testName = id.toLowerCase().replaceAll('-', '_');

        test(testName, async ({ page }) => {
            await page.goto(`/iframe.html?viewMode=story&id=${id}`);
            await page.waitForLoadState('load');
            await page.addStyleTag({
                content: `
                    body svg use {
                        animation: none !important;
                    }
                `,
            });
            // Wait for SB to fully render the components
            await page.waitForTimeout(200);

            await expect(page).toHaveScreenshot({
                animations: 'disabled',
                fullPage: true,
            });
        });
    }
});
