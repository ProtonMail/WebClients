import { type OxfmtConfig, defineConfig } from 'oxfmt';

/**
 * Same options as `@proton/prettier-config-proton`, which formats everything oxfmt has not taken over yet.
 * Keep the two in sync: createOxfmtConfig.test.ts fails when they drift.
 */
export const createOxfmtConfig = (overrides: OxfmtConfig = {}) =>
    defineConfig({
        printWidth: 120,
        arrowParens: 'always',
        singleQuote: true,
        trailingComma: 'es5',
        tabWidth: 4,
        proseWrap: 'never',
        sortImports: {
            newlinesBetween: true,
            customGroups: [
                { groupName: 'proton-style', elementNamePattern: ['@proton/**/*.css', '@proton/**/*.scss'] },
                {
                    groupName: 'proton-mail-style',
                    elementNamePattern: ['proton-mail/**/*.css', 'proton-mail/**/*.scss'],
                },
                { groupName: 'codemirror-style', elementNamePattern: ['codemirror/**/*.css', 'codemirror/**/*.scss'] },
                {
                    groupName: 'relative-style',
                    elementNamePattern: ['./**/*.css', './**/*.scss', '../**/*.css', '../**/*.scss'],
                },
                { groupName: 'react', elementNamePattern: ['react*', 'react*/**'] },
                { groupName: 'codemirror', elementNamePattern: ['codemirror*', 'codemirror*/**'] },
                { groupName: 'proton', elementNamePattern: ['@proton/**'] },
                { groupName: 'proton-mail', elementNamePattern: ['proton-mail*', 'proton-mail*/**'] },
            ],
            groups: [
                'react',
                ['builtin', 'external'],
                'codemirror',
                'proton',
                'proton-mail',
                ['internal', 'parent', 'sibling', 'index'],
                'proton-style',
                'proton-mail-style',
                'codemirror-style',
                'relative-style',
                'style',
                'unknown',
            ],
            ignoreCase: false,
        },
        ...overrides,
    });
