import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    test: {
        clearMocks: true,
        coverage: {
            include: ['lib/**/*.{ts,tsx}'],
            exclude: ['**/*.test.ts', '**/*.test.tsx'],
        },
    },
});
