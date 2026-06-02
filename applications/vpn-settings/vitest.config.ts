import react from '@vitejs/plugin-react';
import path from 'path';
import { transformWithOxc } from 'vite';
import { defineConfig } from 'vitest/config';

const fileMock = path.resolve(__dirname, './src/__mocks__/fileMock.js');
const styleMock = path.resolve(__dirname, './src/__mocks__/styleMock.js');

/**
 * Webpack's `require.context` (used by a few @proton modules) has no Vite equivalent.
 * The old Jest setup handled it via the `transform-require-context` babel plugin; here we
 * rewrite it to a global stub installed in vitest.setup.ts that yields an empty context.
 */
const requireContextStub = {
    name: 'require-context-stub',
    enforce: 'pre' as const,
    transform(code: string) {
        if (!code.includes('require.context')) {
            return null;
        }
        return { code: code.replace(/require\.context/g, 'globalThis.__requireContext'), map: null };
    },
};

/**
 * Some @proton workspace packages ship JSX inside plain `.js` files. The old Jest setup ran
 * `@babel/preset-react` over `.js`; Vite's default `.js` loader can't parse JSX, so we compile
 * those files (outside node_modules) with oxc's jsx parser before the React plugin runs.
 */
const jsAsJsx = {
    name: 'js-as-jsx',
    enforce: 'pre' as const,
    async transform(code: string, id: string) {
        const [filepath] = id.split('?');
        if (!filepath.endsWith('.js') || filepath.includes('/node_modules/')) {
            return null;
        }
        return transformWithOxc(code, id, { lang: 'jsx', jsx: { runtime: 'automatic' } });
    },
};

export default defineConfig({
    plugins: [requireContextStub, jsAsJsx, react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        reporters: [['default', { summary: false }], 'junit'],
        outputFile: { junit: './test-report.xml' },
        // Stub static assets and stylesheets so component imports don't break the test run.
        // The pattern matches the whole import specifier so the replacement swaps it entirely.
        alias: [
            { find: /^.+\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|md)$/, replacement: fileMock },
            { find: /^.+\.(css|scss|less)$/, replacement: styleMock },
        ],
        coverage: {
            enabled: false,
            provider: 'v8',
            reporter: ['text-summary', 'json'],
            include: ['src/**/*.{js,jsx,ts,tsx}'],
            exclude: ['**/*.d.ts', '**/*.test.{ts,tsx}'],
        },
    },
    resolve: {
        // Resolve the browser build of workspace packages, matching the runtime environment.
        conditions: ['browser'],
    },
});
