import react from '@vitejs/plugin-react-swc';
import path from 'path';
import wasm from 'vite-plugin-wasm';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react(), wasm()],
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern',
            },
        },
    },
    test: {
        globals: true,
        environment: 'happy-dom',
        poolOptions: {
            threads: { singleThread: true },
        },
        reporters: ['basic'],
        setupFiles: './vitest.setup.ts',
        maxWorkers: 1,
    },
    resolve: {
        alias: {
            'proton-wallet': path.resolve(__dirname, './src/app'),
        },
    },
});
