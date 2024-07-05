import react from '@vitejs/plugin-react-swc';
import wasm from 'vite-plugin-wasm';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react(), wasm()],
    test: {
        globals: true,
        environment: 'happy-dom',
        poolOptions: {
            threads: { singleThread: true },
        },
        reporters: ['basic'],
        setupFiles: './vitest.setup.ts',
    },
});
