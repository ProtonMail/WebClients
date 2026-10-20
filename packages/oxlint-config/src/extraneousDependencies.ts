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
    '**/oxlint.config.{js,mjs,ts,mts}',
    '**/playwright.config.ts',
];

export interface ExtraneousDependenciesOptions {
    peerDependencies?: boolean;
    devDependencies?: string[];
}

/**
 * Builds the no-extraneous-dependencies rule entry. Exported separately so packages can extend the
 * dev-dependency globs, since a config setting the rule replaces its options.
 *
 * @example
 * createExtraneousDependenciesRule({ devDependencies: [...extraneousDependenciesDevDependencies, '**\/testing/**'] })
 */
export function createExtraneousDependenciesRule({
    peerDependencies = true,
    devDependencies = extraneousDependenciesDevDependencies,
}: ExtraneousDependenciesOptions = {}): [
    'error',
    { devDependencies: string[]; optionalDependencies: false; peerDependencies: boolean },
] {
    return ['error', { devDependencies, optionalDependencies: false, peerDependencies }];
}
