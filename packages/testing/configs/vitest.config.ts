import { defineConfig } from 'vitest/config';

const isCI = !!process.env.CI;

export const sharedVitestConfig = defineConfig({
    resolve: {
        conditions: ['browser'],
    },
    test: {
        coverage: {
            exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx'],
            include: ['src/**/*.{js,jsx,ts,tsx}'],
            provider: 'v8',
            reporter: isCI ? ['text-summary', 'json', 'clover', 'html', 'cobertura'] : ['text-summary', 'html'],
        },
        environment: 'happy-dom',
        globals: true,
        maxWorkers: isCI ? parseInt(process.env.VITEST_MAX_WORKERS || '1', 10) : undefined,
        reporters: isCI
            ? [
                  ['default', { summary: false }],
                  ['junit', { outputFile: 'test-report.xml' }],
              ]
            : [['default', { summary: false }]],
    },
});
