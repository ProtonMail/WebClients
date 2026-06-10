import { playwright } from '@vitest/browser-playwright';
import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/testing/configs/vitest.config';

// Mirror @proton/pack getDateFnsLocales
// TODO: extract to a shared function with @proton/pack
const dateFnsLocaleRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
const require = createRequire(import.meta.url);
const dateFnsLocaleDir = join(dirname(require.resolve('date-fns/package.json')), 'locale');
const getDateFnsLocaleDirs = (): string[] => {
    if (!existsSync(dateFnsLocaleDir)) {
        return [];
    }
    return readdirSync(dateFnsLocaleDir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(join(dateFnsLocaleDir, d.name, 'index.js')))
        .map((d) => d.name);
};

// All locale directories shipped by date-fns. Importing the `date-fns/locale` barrel pulls in every locale, so they
// must all be pre-bundled; otherwise Vite discovers script-subtag locales (e.g. `be-tarask`, `ja-Hira`) mid-run and
// reloads the browser page, which crashes the test file that happens to be importing at that moment.
const allDateFnsLocales = getDateFnsLocaleDirs();

// Only the locales the app actually ships, used for the LOCALES_DATE_FNS define.
const dateFnsLocales = allDateFnsLocales.filter((name) => dateFnsLocaleRegex.test(name));

export default mergeConfig(sharedVitestConfig, {
    define: {
        'process.env': JSON.stringify({ LOCALES_DATE_FNS: dateFnsLocales }),
    },
    optimizeDeps: {
        include: allDateFnsLocales.map((locale) => `date-fns/locale/${locale}/index.js`),
    },
    resolve: {
        // `dateFnLocales.ts` uses a relative path so Vite can analyze the dynamic import; alias it back to the
        // package specifier so locale modules are pre-bundled (raw CJS from node_modules breaks in the browser).
        alias: {
            '../../../../node_modules/date-fns/locale': 'date-fns/locale',
        },
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
