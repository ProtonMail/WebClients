import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    // The repo tsconfig preserves JSX for the bundlers, so compile it here.
    oxc: { jsx: { runtime: 'automatic' } },
    test: {
        environment: 'node',
        // This package has no `src/` folder, so add its root files to the shared `src/**` glob.
        coverage: {
            include: ['*.{ts,tsx}', 'icons/**/*.{ts,tsx}'],
        },
    },
});
