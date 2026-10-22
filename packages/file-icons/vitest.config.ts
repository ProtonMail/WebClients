import { defineConfig } from 'vitest/config';

export default defineConfig({
    // The repo tsconfig preserves JSX for the bundlers, so compile it here.
    oxc: { jsx: { runtime: 'automatic' } },
    test: {
        environment: 'node',
        globals: true,
    },
});
