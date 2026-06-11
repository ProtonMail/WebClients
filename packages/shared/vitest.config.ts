import { playwright } from '@vitest/browser-playwright';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/testing/configs/vitest.config';

export default mergeConfig(sharedVitestConfig, {
    define: {
        'process.env': JSON.stringify({}),
    },
    test: {
        browser: {
            enabled: true,
            provider: playwright({
                launchOptions: { args: ['--no-sandbox'] },
            }),
            headless: true,
            screenshotFailures: false,
            instances: [{ browser: 'chromium' }],
        },
        include: ['test/**/*.{spec,test}.{js,ts,tsx}'],
        restoreMocks: true,
        setupFiles: ['./vitest.setup.ts'],
    },
});
