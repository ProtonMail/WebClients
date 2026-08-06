import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/testing/configs/vitest.config';

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    test: {
        setupFiles: './vitest.setup.ts',
        environmentOptions: {
            happyDOM: {
                // Clicking a link in a test would otherwise make happy-dom fetch the real page over the
                // network and parse its scripts, which is slow, needs connectivity, and floods stderr.
                settings: {
                    navigation: {
                        disableMainFrameNavigation: true,
                        disableChildFrameNavigation: true,
                        disableChildPageNavigation: true,
                    },
                },
            },
        },
        coverage: {
            exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx', '**/*.stories.tsx'],
        },
    },
});
