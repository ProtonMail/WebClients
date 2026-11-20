import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        // Does not use @proton/vitest-config, so it sets the CI worker count itself
        maxWorkers: process.env.CI ? 4 : undefined,
    },
});
