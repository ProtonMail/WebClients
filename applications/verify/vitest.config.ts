import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    oxc: { jsx: { runtime: 'automatic' } },
    test: {
        environment: 'node',
        coverage: {
            exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx', 'src/app/locales.ts'],
        },
    },
});
