import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    test: {
        environment: 'node',
        include: ['*.test.ts'],
        coverage: {
            include: ['*.ts'],
            exclude: ['tool/*', '*.config.ts', 'types.ts', '**/*.test.ts'],
        },
    },
});
