import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

// These files run real OpenPGP or build DOMExceptions, which need the realm of Node and not the one of a vm context
const FORKS_FILES = [
    'src/app/legacy/store/_shares/useLockedVolume/*.test.{ts,tsx}',
    'src/app/modules/download/utils/handleError.test.ts',
    'src/app/modules/search/internal/mainThread/CryptoProxyBridge.test.ts',
    'src/app/utils/telemetry.test.ts',
];

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    test: {
        setupFiles: ['./vitest.setup.ts'],
        server: { deps: { inline: ['@protontech/crypto'] } },
        projects: [
            {
                extends: true,
                test: {
                    name: 'vm',
                    // vm contexts avoid re-creating the whole module graph and the DOM for every file; the Node globals
                    // missing from the context are restored in vitest.setup.ts
                    pool: 'vmThreads',
                    // vm contexts can leak memory: recycle a worker once it grows past this limit
                    vmMemoryLimit: '400MB',
                    exclude: ['**/node_modules/**', ...FORKS_FILES],
                },
            },
            {
                extends: true,
                test: {
                    name: 'forks',
                    include: FORKS_FILES,
                },
            },
        ],
    },
});
