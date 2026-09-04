import { defineConfig } from 'eslint/config';

import { allGlobs } from './globs.js';

export const extraneousDependenciesDevDependencies = [
    // Types
    '**/global.d.ts',
    // Build
    '**/build.mjs',
    '**/postcss.config.{js,ts}',
    '**/webpack.config.{js,ts}',
    '**/webpack.options.{js,ts}',
    // Jest
    '**/__mocks__/**',
    '**/__tests__/**',
    '**/jest.config.{js,ts}',
    '**/jest.setup.{js,ts}',
    '**/jest.transform.{js,ts}',
    // Vite
    '**/vite.config.{js,ts}',
    '**/vitest.config.{js,ts}',
    '**/vitest.setup.{js,ts}',
    // Tests, including directories holding helpers consumed only by test files
    '**/tests/**',
    '**/test-helpers/**',
    '**/*.test.{js,ts,tsx,jsx}',
    '**/*.spec.{js,ts,tsx,jsx}',
    // Others
    '**/cypress.config.{js,ts}',
    '**/eslint.config.{js,mjs}',
    '**/playwright.config.ts',
];

/**
 * Builds the `import/no-extraneous-dependencies` rule entry. Exported separately so packages can
 * override or disable it locally (flat config replaces a rule's options wholesale per matching
 * file, it doesn't merge across config objects).
 * @example
 * createExtraneousDependenciesRule({ peerDependencies: false })
 */
export function createExtraneousDependenciesRule({
    peerDependencies = true,
    devDependencies = extraneousDependenciesDevDependencies,
} = {}) {
    return /** @type {import('@eslint/core').RuleConfig} */ ([
        'error',
        {
            devDependencies,
            optionalDependencies: false,
            peerDependencies,
        },
    ]);
}

/**
 * Creates an extraneous dependencies rule configuration.
 * @example
 * createExtraneousDependenciesConfig({ peerDependencies: false })
 */
export function createExtraneousDependenciesConfig(options = {}) {
    return defineConfig({
        name: 'extraneous-dependencies-rules',
        files: allGlobs,
        rules: {
            'import/no-extraneous-dependencies': createExtraneousDependenciesRule(options),
        },
    });
}

export default createExtraneousDependenciesConfig();
