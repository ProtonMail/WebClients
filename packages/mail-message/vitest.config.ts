import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    // /icons ships .tsx sources; the tsconfig keeps jsx as preserve, so transform it explicitly
    oxc: { jsx: { runtime: 'automatic' } },
    test: {
        setupFiles: ['./vitest.setup.ts'],
        // vmThreads creates the happy-dom environment once per worker instead of once per file
        pool: 'vmThreads',
        testTimeout: 10000,
        server: {
            deps: {
                inline: ['@protontech/crypto'],
            },
        },
    },
});
