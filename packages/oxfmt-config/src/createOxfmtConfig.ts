import { type OxfmtConfig, defineConfig } from 'oxfmt';

/** SCSS keeps its own indentation */
export const scssOptions: OxfmtConfig = { tabWidth: 2, useTabs: true };

/**
 * Shared oxfmt options of the monorepo. A workspace can extend them: `overrides` replaces top level options and
 * its `overrides` entries are appended to the shared ones, so they win.
 */
export const createOxfmtConfig = ({ overrides = [], ...options }: OxfmtConfig = {}) =>
    defineConfig({
        printWidth: 120,
        arrowParens: 'always',
        singleQuote: true,
        trailingComma: 'es5',
        tabWidth: 4,
        proseWrap: 'never',
        // package.json files are sorted by sort-package-json, which lint-staged runs
        sortPackageJson: false,
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
        ...options,
        overrides: [{ files: ['**/*.scss'], options: scssOptions }, ...overrides],
    });
