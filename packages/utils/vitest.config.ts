import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    test: {
        // Pure logic tests: Node already provides webcrypto, no DOM needed.
        environment: 'node',
        include: ['src/**/*.test.ts'],
        clearMocks: true,
    },
});
