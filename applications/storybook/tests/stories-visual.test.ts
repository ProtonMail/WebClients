import { expect, test } from '@playwright/test';

import { getStorybooIds } from './get-storybook-ids';

const ids = getStorybooIds();

test.describe('visual tests', () => {
    const fixedDateTime = new Date('2026-01-01T00:00:00Z');

    for (const id of ids) {
        // NOTE: this is necessary otherwise the snapshot file name will be invalid
        const testName = id.toLowerCase().replaceAll('-', '_');

        test(testName, async ({ page }) => {
            await page.clock.setFixedTime(fixedDateTime);
            await page.goto(`/iframe.html?id=${id}`);
            await page.waitForLoadState('load');
            await page.addStyleTag({
                content: `
                    body svg use {
                        animation: none !important;
                    }
                    body table.docblock-argstable {
                        display: none !important;
                        overflow: hidden !important;
                        visibility: hidden !important;
                    }
                `,
            });

            // Wait for SB to fully render the components
            await page.waitForTimeout(300);

            await expect(
                page.locator('.sb-errordisplay'),
                `Storybook error page displayed instead of the story`
            ).not.toBeVisible();

            await expect(page).toHaveScreenshot({
                animations: 'disabled',
                fullPage: true,
                mask: [page.locator('#anchor--components-promotion-button--responsive')],
            });
        });
    }
});
