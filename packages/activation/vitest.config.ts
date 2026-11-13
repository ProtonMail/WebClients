import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    test: {
        setupFiles: './vitest.setup.ts',
        css: false,
        // msw resolves the relative handler paths against the page URL
        environmentOptions: { happyDOM: { url: 'http://localhost/' } },
        coverage: {
            exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx', '**/*.interface.ts', 'src/tests/**'],
        },
    },
});
