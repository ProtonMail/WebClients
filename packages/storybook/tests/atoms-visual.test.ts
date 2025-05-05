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

    const ids = Object.keys(parsedContent.entries).filter((id: string) => id.endsWith('--docs'));

    return ids;
}

test.describe('visual tests', () => {
    const ids = getStorybooIds();

    for (const id of ids) {
        // NOTE: this is necessary otherwise the snapshot file name will be invalid
        const testName = id.replaceAll('-', '_');

        test(testName, async ({ page }) => {
            await page.goto(`/iframe.html?viewMode=docs&id=${id}`);
            await page.waitForLoadState('domcontentloaded');
            await page.addStyleTag({
                content: `
                    body svg use {
                        animation: none !important;
                    }
                `,
            });

            await expect(page).toHaveScreenshot({
                animations: 'disabled',
                fullPage: true,
            });
        });
    }

    // TODO: remove this once done with the migration (it's used to take screenshots of the old stories)
    // const id = 'components-NAME--basic';
    // test(id.replaceAll('-', '_'), async ({ page }) => {
    // await page.goto(`http://localhost:6006/iframe.html?viewMode=docs&id=${id}`);
    // await page.waitForLoadState('domcontentloaded');
    // await page.addStyleTag({
    //     content: `
    //         body svg use {
    //             animation: none !important;
    //         }
    //     `,
    // });

    //     await expect(page).toHaveScreenshot({
    //         fullPage: true,
    //     });
    // });
});
