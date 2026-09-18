import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./vitest.setup.ts'],
        include: ['tests/**/*.test.ts'],
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
