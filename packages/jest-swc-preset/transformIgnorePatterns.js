/**
 * Dependencies published as untranspiled ESM/TypeScript that every Jest config in the monorepo
 * needs to run through the swc transform. Add a module here when it is pulled in (directly or
 * through `@proton/shared` / `@proton/components`) by most apps and packages; app-specific
 * modules should be passed to `getTransformIgnorePatterns` instead.
 *
 * `\\.pnpm` lets the lookahead pass through the `.pnpm` virtual store directory so the module
 * names that follow it are matched too.
 */
const BASE_TRANSFORMED_MODULES = [
    '\\.pnpm',
    '@proton/shared',
    '@proton/components',
    '@protontech/telemetry',
    '@protontech/logger',
    '@protontech/mutex-browser',
    '@protontech/crypto',
    'openpgp',
    '@protontech/openpgp',
    '@openpgp/web-stream-tools',
    '@protontech/bip39',
    'emoji-mart',
    '@preact/signals-core',
    '@scure/base',
];

/**
 * Builds the `transformIgnorePatterns` entry: everything in `node_modules` is left untouched,
 * except the shared base modules and the given `additionalModules`.
 *
 * @param {string[]} [additionalModules] Extra module names (or path prefixes, e.g.
 *   `@protontech/pass-rust-core/ui`) that need to be transformed for this config only.
 * @returns {string[]}
 */
const getTransformIgnorePatterns = (additionalModules = []) => {
    const modules = [...new Set([...BASE_TRANSFORMED_MODULES, ...additionalModules])];
    return [`node_modules/(?!(${modules.join('|')})/)`];
};

module.exports = { getTransformIgnorePatterns };
