import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    test: {
        environment: 'jsdom',
        clearMocks: true,
        setupFiles: ['./vitest.setup.ts'],
        coverage: {
            include: ['*.ts', '*.tsx'],
            exclude: ['*.config.ts', 'vitest.setup.ts', '**/*.test.ts', '**/*.test.tsx'],
        },
    },
});
