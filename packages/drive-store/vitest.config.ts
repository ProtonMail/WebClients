import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

// `.test.ts` files that need a DOM (renderHook, waitFor, window, localStorage...) run with the `.test.tsx` ones
const domTests = [
    'store/_downloads/download/downloadBlock.test.js',
    'store/_downloads/download/downloadLinkFolder.test.ts',
    'store/_links/useLink.test.ts',
    'utils/lastActivePersistedUserSession.test.ts',
    'utils/metrics/worker/shared-metrics.worker.test.ts',
    'utils/replaceLocalURL.test.ts',
    'utils/telemetry.test.ts',
    'utils/url/password.test.ts',
    'zustand/public/public-share.store.test.ts',
];

// Timing-sensitive stream test: its retry sequence differs inside a vm context, so it keeps the default pool
const domForksTest = 'store/_downloads/download/downloadBlocks.test.ts';

const shared = {
    extends: true,
    plugins: [react()],
    test: {
        setupFiles: ['./vitest.setup.ts'],
        server: {
            deps: {
                inline: ['client-zip', 'uuid', '@protontech/crypto'],
            },
        },
    },
};

export default mergeConfig(sharedVitestConfig, {
    test: {
        coverage: {
            include: ['**/*.{ts,tsx,js}'],
            exclude: ['**/*.d.ts', '**/*.test.*', 'vitest.config.ts', 'vitest.setup.ts'],
        },
        projects: [
            // Logic tests don't need a DOM: node skips the per-file happy-dom startup (9.8s -> 1.7s on the full run)
            mergeConfig(shared, {
                test: {
                    name: 'node',
                    environment: 'node',
                    include: ['**/*.test.{ts,js}'],
                    exclude: ['**/node_modules/**', ...domTests, domForksTest],
                },
            }),
            // Inherits happy-dom from the shared config
            mergeConfig(shared, {
                test: {
                    name: 'dom',
                    include: ['**/*.test.tsx', ...domTests],
                    pool: 'vmThreads',
                    vmMemoryLimit: '400MB',
                },
            }),
            // Inherits happy-dom from the shared config
            mergeConfig(shared, {
                test: {
                    name: 'dom-forks',
                    include: [domForksTest],
                },
            }),
        ],
    },
});
