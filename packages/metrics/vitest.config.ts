import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    test: {
        setupFiles: './vitest.setup.ts',
        include: ['tests/**/*.test.ts'],
        clearMocks: true,
        coverage: {
            include: ['**/*.ts'],
            exclude: ['**/*.d.ts', 'tests/**', 'scripts/**', 'types/**', '*.config.ts', 'vitest.setup.ts'],
        },
    },
});
