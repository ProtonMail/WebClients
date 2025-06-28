import { expect, test } from '@playwright/test';

import { getStorybooIds } from './get-storybook-ids';

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
