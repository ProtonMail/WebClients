import { createOxfmtConfig } from '@proton/oxfmt-config/createOxfmtConfig';

const shared = createOxfmtConfig();
const sortImports = typeof shared.sortImports === 'object' ? shared.sortImports : {};

export default createOxfmtConfig({
    ignorePatterns: [
        '**/config.ts',
        'applications/**/locales/**/*.json',
        'applications/**/public/assets/sandbox.js',
        'applications/authenticator/src/lib/tauri/generated/__bindings__.ts',
        'applications/wallet/src/pkg/',
        'packages/i18n/test/input/**',
        'packages/metrics/types/**/*.d.ts',
        'packages/oxlint-config/src/optional/**',
        'packages/styles/scss/**/_index.scss',
        'packages/wasm/**/*',
        'tests/account/poms/LoginPage/challenge.html',
        'tests/drive/tools/tests-mapping/test-index.json',
        'tests/mail-renderer/tests/**/*.html',
        'tests/mail-renderer/public/**',
        'tests/pass/extension/**/*',
        'tests/pass/hars/**/*',
        // Docs and Storybook do not format JSON, Markdown and SVG files
        'applications/docs/**/*.{json,md,svg}',
        'applications/docs-editor/**/*.{json,md,svg}',
        'applications/storybook/**/*.{json,md}',
        'packages/docs-core/**/*.{json,md,svg}',
        'packages/docs-proto/**/*.{json,md,svg}',
        'packages/docs-shared/**/*.{json,md,svg}',
        // Test fixtures
        'packages/encrypted-search/test/**',
        'packages/i18n/test/**',
        'packages/key-transparency/test/**',
        // The desktop apps check their own files
        ...['inbox-desktop', 'meet-desktop'].flatMap((app) => [
            `applications/${app}/.webpack/**`,
            `applications/${app}/build/**`,
            `applications/${app}/ci/**`,
            `applications/${app}/coverage/**`,
            `applications/${app}/out/**`,
            `applications/${app}/locales/**`,
            `applications/${app}/assets/*.svg`,
            `applications/${app}/assets/windows/squirrel/template.wxs`,
            `applications/${app}/appConfig.json`,
        ]),
        'applications/inbox-desktop/.gitlab-ci.yml',
        'applications/inbox-desktop/assets/macos/macos/Mail.icon/**',
        'applications/meet-desktop/.gitlab-ci.yml',
    ],
    overrides: [
        {
            // The desktop apps never used the shared style: double quotes, no import sorting
            files: ['applications/inbox-desktop/**', 'applications/meet-desktop/**'],
            options: {
                singleQuote: false,
                trailingComma: 'all',
                tabWidth: 4,
                printWidth: 120,
                proseWrap: 'preserve',
                sortImports: false,
            },
        },
        {
            files: ['packages/docs-core/**'],
            options: { semi: false, tabWidth: 2, trailingComma: 'all', sortImports: false },
        },
        {
            // Docs follows its own style, and has no import sorting
            files: [
                'applications/docs/**',
                'applications/docs-editor/**',
                'packages/docs-proto/**',
                'packages/docs-shared/**',
            ],
            options: { semi: false, tabWidth: 2, trailingComma: 'all', sortImports: false, sortTailwindcss: {} },
        },
        {
            // Increases `printWidth` for readability
            files: ['packages/pass/store/**'],
            options: { printWidth: 140 },
        },
        {
            // proton-pass-* and proton-pass-desktop-native are internal aliases: sort them right after @proton/*
            files: ['applications/pass-desktop/**'],
            options: {
                sortImports: {
                    ...sortImports,
                    customGroups: [
                        ...(sortImports.customGroups ?? []),
                        { groupName: 'proton-pass', elementNamePattern: ['proton-pass*', 'proton-pass*/**'] },
                    ],
                    groups: (sortImports.groups ?? []).flatMap((group) =>
                        group === 'proton' ? [group, 'proton-pass'] : [group]
                    ),
                },
            },
        },
        {
            // Playwright configs keep their imports in the order they are written
            files: [
                'tests/**/account/account.config.ts',
                'tests/**/calendar/calendar.config.ts',
                'tests/**/docs/playwright.config.ts',
                'tests/**/drive/drive.config.ts',
                'tests/**/drive/prod/drive.config.ts',
                'tests/**/drive/playwright.config.ts',
                'tests/**/drive/prod/playwright.config.ts',
                'tests/**/drive/cross-client/playwright.config.ts',
                'tests/**/mail/mail.config.ts',
                'tests/**/mail/playwright.config.filtered.ts',
                'tests/**/payments/payments.config.ts',
                'tests/**/payments/playwright.config.ts',
                'tests/**/payments/playwright.config.filtered.ts',
            ],
            options: { sortImports: false },
        },
    ],
});
