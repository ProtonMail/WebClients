import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    optimizeDeps: {
        // Without this, these worker dependencies are discovered "too late" and trigger a test reload,
        // which causes issues with the worker dynamic imports since the corresponding chunk names
        // become stale
        include: ['core-js/proposals/array-buffer-base64', 'core-js/stable'],
    },
    plugins: [
        {
            name: 'replace-string',
            transform(code: string) {
                // Drop webpack magic comment as it interferes with the vitest worker detection for some reason
                return code.replaceAll('/* webpackChunkName: "crypto-worker" */', '');
            },
        },
    ],
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
