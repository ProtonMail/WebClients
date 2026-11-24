import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    // The module resolves these from applications/docs: keep one copy of each.
    resolve: {
        dedupe: ['react', 'react-dom'],
    },
    css: {
        postcss: {
            // Each stylesheet names its config with `@config`: src/tailwind.css and the module's tailwind.scss.
            plugins: [tailwindcss()],
        },
    },
    server: { port: 8098, strictPort: true },
});
