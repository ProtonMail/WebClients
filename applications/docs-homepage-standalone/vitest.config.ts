import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.ts';

// The same browser project as the standalone editors' (realtime's packages/docs-editor), on the page's Vite config,
// so the tests load the module and its styles as `pnpm start` does.

// RECORD_TESTS=<dir> records each browser test file to a video in <dir>, slowed by
// RECORD_TESTS_SLOW_MO milliseconds per action, with a longer test timeout. Unset, runs are unchanged.
const recordTests = process.env.RECORD_TESTS;
if (recordTests && process.env.PLAYWRIGHT_CHANNEL) {
    throw new Error(
        "Chrome's video leaves out the bottom of the page: unset PLAYWRIGHT_CHANNEL to record with the default headless shell."
    );
}
const viewport = { width: 1280, height: 720 };

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            globals: true,
            // Every test in the terminal: the default reporter leaves out passing tests faster than 300 ms.
            reporters: ['verbose'],
            // Undoes each test's spies, such as a stubbed `window.open`, before the next one.
            restoreMocks: true,
            projects: [
                {
                    extends: true,
                    test: {
                        name: 'browser',
                        include: ['src/**/*.browser.test.tsx'],
                        testTimeout: recordTests ? 60_000 : undefined,
                        maxWorkers: 2,
                        browser: {
                            enabled: true,
                            headless: true,
                            provider: playwright({
                                launchOptions: {
                                    channel: process.env.PLAYWRIGHT_CHANNEL,
                                    slowMo: recordTests ? Number(process.env.RECORD_TESTS_SLOW_MO ?? 200) : undefined,
                                },
                                contextOptions: {
                                    ...(recordTests && { viewport, recordVideo: { dir: recordTests, size: viewport } }),
                                },
                            }),
                            instances: [{ browser: 'chromium' }],
                            viewport,
                        },
                    },
                },
            ],
        },
    })
);
