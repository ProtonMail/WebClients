import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    // The repo tsconfig preserves JSX for the bundlers, so compile it here.
    oxc: { jsx: { runtime: 'automatic' } },
    test: {
        environment: 'jsdom',
        clearMocks: true,
    },
});
