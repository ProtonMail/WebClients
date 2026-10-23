import { defineConfig } from 'eslint/config';

import { extraneousDependenciesDevDependencies } from '@proton/oxlint-config/extraneousDependencies';
import { allGlobs } from '@proton/oxlint-config/globs';

export { extraneousDependenciesDevDependencies };

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
