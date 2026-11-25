import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    test: {
        setupFiles: './vitest.setup.ts',
        // Composer render tests (full store, API mocks) need 10s
        testTimeout: 10000,
        // Memory-bound: default forks pool needs ~3.9GB across workers, one vmThreads worker ~1GB at the same speed
        pool: 'vmThreads',
        maxWorkers: 1,
    },
});
