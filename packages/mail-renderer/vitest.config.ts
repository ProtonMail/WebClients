import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    test: {
        pool: 'vmThreads',
        vmMemoryLimit: '400MB',
        testTimeout: 10000,
        setupFiles: ['./vitest.setup.ts'],
    },
});
