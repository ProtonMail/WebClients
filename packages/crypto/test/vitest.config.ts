import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/**/*.spec.ts'],
        browser: {
            provider: playwright(),
            enabled: true,
            headless: true,
            screenshotFailures: false,
            instances: process.env.CI
                ? [
                      {
                          name: 'chromium-sandboxed',
                          browser: 'chromium',
                          provider: playwright({
                              launchOptions: {
                                  chromiumSandbox: true,
                              },
                          }),
                      },
                  ]
                : [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
        },
    },
});
