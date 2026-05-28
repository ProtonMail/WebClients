import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react() as any],
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
            exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx', '**/*.stories.tsx'],
        },
    },
    resolve: {
        conditions: ['browser'],
    },
});
