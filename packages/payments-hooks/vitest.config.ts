import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    test: {
        setupFiles: './vitest.setup.ts',
        coverage: {
            include: ['**/*.{ts,tsx}'],
            exclude: ['**/*.test.{ts,tsx}', '**/__mocks__/**', 'testing/**', '*.config.ts', 'vitest.setup.ts'],
        },
        environmentOptions: {
            happyDOM: {
                settings: {
                    navigation: {
                        disableMainFrameNavigation: true,
                        disableChildFrameNavigation: true,
                        disableChildPageNavigation: true,
                    },
                },
            },
        },
    },
});
