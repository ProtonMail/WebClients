import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/testing/configs/vitest.config';

export default mergeConfig(sharedVitestConfig, {
    test: {
        coverage: {
            include: ['src/**/*.{ts}'],
            exclude: ['**/*.d.ts', '**/*.test.ts'],
        },
    },
});
