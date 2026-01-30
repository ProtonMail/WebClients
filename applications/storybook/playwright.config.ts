import { defineConfig, devices } from '@playwright/test';
import { availableParallelism } from 'node:os';

const TIMEOUT = 10000;

export default defineConfig({
    expect: {
        timeout: TIMEOUT,
        toMatchSnapshot: {
            maxDiffPixels: 15,
            maxDiffPixelRatio: 0.1,
            threshold: 0.2,
        },
        toHaveScreenshot: {
            animations: 'disabled',
            maxDiffPixels: 15,
            maxDiffPixelRatio: 0.1,
            threshold: 0.2,
        },
    },
    projects: [
        // TODO: Find a final list of devices to test on
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            fullyParallel: true,
        },
    ],
    reporter: 'list',
    retries: 1,
    testDir: './tests',
    testMatch: '*.test.ts',
    timeout: TIMEOUT,
    use: {
        baseURL: 'http://localhost:3000',
    },
    workers: availableParallelism() - 1,
});
