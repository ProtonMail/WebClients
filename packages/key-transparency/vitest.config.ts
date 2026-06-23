import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./vitest.setup.ts'],
        include: ['test/**/*.test.ts'],
        server: {
            deps: {
                inline: ['@protontech/crypto'],
            },
        },
        reporters: [
            [
                'default',
                {
                    summary: false,
                },
            ],
        ],
    },
    resolve: {
        conditions: ['browser'],
    },
});
