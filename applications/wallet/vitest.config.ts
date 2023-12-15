import react from '@vitejs/plugin-react-swc';
import path from 'path';
import wasm from 'vite-plugin-wasm';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react(), wasm()],
    test: {
        globals: true,
        environment: 'jsdom',
        poolOptions: {
            threads: { singleThread: true },
        },
        reporters: ['basic'],
        setupFiles: './vitest.setup.ts',
    },
    resolve: {
        alias: {
            'proton-wallet': path.resolve(__dirname, './src/app'),
        },
    },
});
