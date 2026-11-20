import { defineConfig } from 'vitest/config';

const isCI = !!process.env.CI;

export const sharedVitestConfig = defineConfig({
    resolve: {
        conditions: ['browser'],
    },
    test: {
        coverage: {
            enabled: process.env.COLLECT_COVERAGE === 'true',
            exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx'],
            include: ['src/**/*.{js,jsx,ts,tsx}'],
            provider: 'v8',
            reporter: isCI ? ['text-summary', 'json', 'clover', 'html', 'cobertura'] : ['text-summary', 'html'],
        },
        environment: 'happy-dom',
        globals: true,
        // Workers per vitest task in CI, where turbo runs several tasks at once on one pod. A
        // package sets its own maxWorkers to run fewer. Locally, vitest's default applies.
        maxWorkers: isCI ? 4 : undefined,
        reporters: isCI
            ? [
                  ['default', { summary: false }],
                  ['junit', { outputFile: 'test-report.xml' }],
              ]
            : [['default', { summary: false }]],
    },
});
