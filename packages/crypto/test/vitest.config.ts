import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const testFilesToInclude = ['test/**/*.spec.ts'];

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
        include: testFilesToInclude,
        typecheck: {
            enabled: true,
            include: testFilesToInclude, // typechecking is run over these files only
        },
        browser: {
            provider: playwright(),
            enabled: true,
            headless: true,
            screenshotFailures: false,
            instances: process.env.CI
                ? [
                      {
                          name: 'chromium-no-sandbox',
                          browser: 'chromium',
                          provider: playwright({
                              launchOptions: {
                                  chromiumSandbox: false,
                              },
                          }),
                      },
                  ]
                : [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
        },
    },
});
