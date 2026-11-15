import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    test: {
        environment: 'jsdom',
        clearMocks: true,
        coverage: {
            include: ['*.ts', '*.tsx'],
            exclude: ['index.ts', '*.config.ts', '**/*.test.ts', '**/*.test.tsx'],
        },
    },
});
