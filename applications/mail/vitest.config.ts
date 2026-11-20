import path from 'node:path';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    // The tsconfig keeps jsx as preserve, so transform it explicitly
    oxc: { jsx: { runtime: 'automatic' } },
    resolve: { alias: { 'proton-mail': path.resolve(__dirname, 'src/app') } },
    test: {
        // Default pool: 81s. vmForks builds the DOM once per worker: 24s, but it leaks (10 GB at 4 workers), so a worker is
        // recycled past the limit. 4 workers, whole process tree: 200MB 33s / 2.9 GB, 300MB 28s / 2.9 GB, 500MB 24s / 4.3 GB
        pool: 'vmForks',
        vmMemoryLimit: '300MB',
        setupFiles: ['./vitest.setup.ts'],
        environmentOptions: { happyDOM: { url: 'http://localhost/' }, jsdom: { url: 'http://localhost/' } },
        coverage: {
            exclude: [
                'src/**/*.testing.ts',
                'src/app/locales.ts',
                'src/app/*.{js,jsx,ts,tsx}',
                'src/app/components/layout/*.{js,jsx,ts,tsx}',
                'src/app/components/onboarding/**/*.{js,jsx,ts,tsx}',
                'src/app/helpers/encryptedSearch/**/*.{js,jsx,ts,tsx}',
                'src/app/containers/eo/**/*.{js,jsx,ts,tsx}',
            ],
        },
        server: {
            deps: {
                inline: ['@protontech/crypto', /msw/, /@mswjs/, /until-async/],
            },
        },
    },
});
