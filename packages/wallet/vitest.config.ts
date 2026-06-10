import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/testing/configs/vitest.config';

export default mergeConfig(sharedVitestConfig, {
    plugins: [react(), wasm()],
    test: {
        setupFiles: './vitest.setup.ts',
    },
});
