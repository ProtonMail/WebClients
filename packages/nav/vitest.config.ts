import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'happy-dom',
        reporters: [
            [
                'default',
                {
                    summary: false,
                },
            ],
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text-summary', 'json', 'clover', 'html', 'cobertura'],
            include: ['src/**/*.{ts}'],
            exclude: ['**/*.d.ts', '**/*.test.ts'],
        },
        maxWorkers: 1,
    },
    resolve: {
        conditions: ['browser'],
    },
});
