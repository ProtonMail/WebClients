import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    test: {
        globals: true,
        environment: 'happy-dom',
        environmentOptions: {
            happyDOM: {
                settings: { enableIframePageLoading: true },
            },
        },
        include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
        setupFiles: ['./vitest.setup.ts'],
        server: {
            deps: {
                inline: ['@protontech/crypto', '@scure/base'],
            },
        },
    },
});
