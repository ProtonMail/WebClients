import react from '@vitejs/plugin-react-swc';
import wasm from 'vite-plugin-wasm';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react(), wasm()],
    test: {
        globals: true,
        environment: 'happy-dom',
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
            reporter: ['text-summary', 'json', 'clover', 'html', 'cobertura'],
            include: ['src/**/*.{js,jsx,ts,tsx}'],
            exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx'],
        },
        maxWorkers: 1,
    },
    resolve: {
        conditions: ['browser'],
    },
});
