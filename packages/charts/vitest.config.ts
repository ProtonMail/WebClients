import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    test: {
        setupFiles: './vitest.setup.ts',
        coverage: {
            exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx'],
        },
    },
});
