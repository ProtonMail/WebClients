import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    test: {
        environment: 'node',
        setupFiles: ['./vitest.setup.ts'],
        server: { deps: { inline: [/@protontech\/crypto/] } },
        coverage: {
            exclude: [
                '**/*.d.ts',
                '**/*.test.ts',
                '**/*.test.tsx',
                '**/*.spec.ts',
                '**/*.spec.tsx',
                'src/app/locales.ts',
            ],
        },
    },
});
