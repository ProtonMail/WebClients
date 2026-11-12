import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

const shared = {
    plugins: [react()],
    resolve: sharedVitestConfig.resolve,
    test: {
        globals: true,
        server: {
            deps: {
                inline: ['@protontech/crypto', '@scure/base'],
            },
        },
    },
};

export default mergeConfig(sharedVitestConfig, {
    test: {
        coverage: {
            include: ['**/*.{ts,tsx}'],
            exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx', 'testing/**', 'tests/**'],
        },
        projects: [
            // Logic tests don't need a DOM: node skips the per-file happy-dom startup.
            // A `.test.ts` that needs one opts in with `// @vitest-environment happy-dom`.
            mergeConfig(shared, {
                extends: false,
                test: {
                    name: 'node',
                    environment: 'node',
                    include: ['**/*.test.ts'],
                    setupFiles: ['./vitest.setup.ts'],
                },
            }),
            mergeConfig(shared, {
                extends: false,
                test: {
                    name: 'dom',
                    environment: 'happy-dom',
                    include: ['**/*.test.tsx'],
                    setupFiles: ['./vitest.setup.ts'],
                },
            }),
        ],
    },
});
