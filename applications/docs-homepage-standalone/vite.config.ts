import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import docsTailwindConfig from 'proton-docs/tailwind.config';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';

const homepageDir = fileURLToPath(new URL('../docs/src/app/homepage', import.meta.url));
const srcDir = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
    plugins: [react()],
    // The module resolves these from applications/docs: keep one copy of each.
    resolve: {
        dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom', 'react-router-dom-v5-compat'],
    },
    css: {
        postcss: {
            // The docs app's Tailwind setup, scanning only the homepage module and this app.
            plugins: [
                tailwindcss({
                    ...docsTailwindConfig,
                    content: [`${homepageDir}/**/*.{ts,tsx}`, `${srcDir}/**/*.tsx`],
                }),
            ],
        },
    },
    server: { port: 8098, strictPort: true },
});
