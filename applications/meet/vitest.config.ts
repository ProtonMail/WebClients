import react from '@vitejs/plugin-react-swc';
import path from 'path';
import wasm from 'vite-plugin-wasm';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react(), wasm()],
    test: {
        globals: true,
        environment: 'happy-dom',
        poolOptions: {
            singleThread: true,
        },
        reporters: [
            [
                'default',
                {
                    summary: false,
                },
            ],
        ],
        setupFiles: './vitest.setup.ts',
        coverage: {
            provider: 'v8',
            reporter: ['text-summary', 'json', 'clover', 'html'],
            include: ['src/**/*.{js,jsx,ts,tsx}'],
            exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx'],
        },
    },
    resolve: {
        alias: {
            'proton-meet': path.resolve(__dirname, './src/app'),
        },
        conditions: ['browser'],
    },
});
