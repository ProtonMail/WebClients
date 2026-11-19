import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    test: {
        // Only useCategoriesData.test.ts needs a DOM (it opts in to happy-dom per file); measured faster than happy-dom everywhere
        environment: 'node',
        // Default is 5000 (5 seconds)
        testTimeout: 10000,
    },
});
