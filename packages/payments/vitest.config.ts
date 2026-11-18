import { defineConfig, mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(
    sharedVitestConfig,
    defineConfig({
        test: {
            coverage: {
                include: ['**/*.{ts,tsx}'],
                exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx', 'testing/**', 'tests/**'],
            },
            // Logic tests don't need a DOM: node skips the per-file happy-dom startup.
            // A test that needs one opts in with `// @vitest-environment happy-dom`.
            environment: 'node',
            // Keeps per-file isolation but shares the module transform/import cost across files.
            pool: 'vmThreads',
            setupFiles: ['./vitest.setup.ts'],
            server: {
                deps: {
                    inline: ['@protontech/crypto', '@scure/base'],
                },
            },
        },
    })
);
