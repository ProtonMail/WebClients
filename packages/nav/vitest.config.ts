import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    test: {
        coverage: {
            include: ['src/**/*.{ts}'],
            exclude: ['**/*.d.ts', '**/*.test.ts'],
        },
    },
});
