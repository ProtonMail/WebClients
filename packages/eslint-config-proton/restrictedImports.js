/**
 * The ESLint side of the `proton/restricted-imports` rule. The restriction lists (BASE, ROLLOUT) and the merging live
 * in `@proton/oxlint-config/restrictedImports`, shared with the oxlint rule of the same name, so both linters enforce
 * the same restrictions with the same options.
 *
 * Why not `no-restricted-imports`: flat config replaces a rule's options for each file instead of merging them, so
 * any config setting that rule dropped every restriction set elsewhere. This rule keeps the shared lists inside
 * itself and clients only pass additions, so they cannot remove a shared restriction by accident.
 * Matching is delegated to `@typescript-eslint/no-restricted-imports`, so `paths`, `patterns`, `importNames`
 * and `export ... from` behave exactly like the built-in rule.
 *
 * What a client can pass to `createRestrictedImportsConfig` (details on the function, at the bottom):
 *   - `rollout`   ids of ROLLOUT restrictions to turn on, e.g. 'components-barrel'
 *   - `paths`     extra bans on one exact module specifier, optionally only for some named exports
 *   - `patterns`  extra bans on every specifier matching a gitignore-style glob
 *   - `files`     limit the config to some files (default: all)
 *
 * @example client config
 * createRestrictedImportsConfig({
 *     rollout: ['account-barrel', 'components-barrel'],
 *     paths: [{ name: 'some-package', importNames: ['oldHelper'], message: 'Use newHelper instead.' }],
 *     patterns: [{ group: ['@proton/foo/*'], message: 'Only the entry point is public.' }],
 * })
 */
import { defineConfig } from 'eslint/config';
import { plugin as typescriptEslintPlugin } from 'typescript-eslint';

import { assertKnownRolloutIds, collectRestrictions, rolloutIds } from '@proton/oxlint-config/restrictedImports';

import { allGlobs } from './globs.js';

export { iconRestrictedMessage } from '@proton/oxlint-config/restrictedImports';

/**
 * @typedef {import('@proton/oxlint-config/restrictedImports').RestrictedPath} RestrictedPath
 * @typedef {import('@proton/oxlint-config/restrictedImports').RestrictedPattern} RestrictedPattern
 */

// ---------------------------------------------------------------------------------------------------------------------
// The rule and its plugin
// ---------------------------------------------------------------------------------------------------------------------

/** The rule that does the matching. We only feed it the merged lists. */
const matcher = /** @type {import('eslint').Rule.RuleModule} */ (
    /** @type {unknown} */ (typescriptEslintPlugin.rules?.['no-restricted-imports'])
);

export const restrictedImportsPlugin = {
    meta: { name: 'proton' },
    rules: {
        'restricted-imports': /** @type {import('eslint').Rule.RuleModule} */ ({
            meta: {
                type: 'problem',
                docs: { description: 'Restrict imports: shared base list, rollout list, and per-client additions.' },
                schema: [
                    {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            rollout: { type: 'array', items: { enum: rolloutIds }, uniqueItems: true },
                            paths: { type: 'array' },
                            patterns: { type: 'array' },
                        },
                    },
                ],
                // The matcher reports with its own message ids, and ESLint looks them up on the rule that is running.
                messages: matcher.meta?.messages ?? {},
            },

            create(context) {
                const { rollout = [], paths = [], patterns = [] } = context.options[0] ?? {};

                // Same context, but with the merged lists as the rule options.
                return matcher.create(
                    Object.create(context, {
                        options: { value: [collectRestrictions(context.filename, { rollout, paths, patterns })] },
                    })
                );
            },
        }),
    },
};

// ---------------------------------------------------------------------------------------------------------------------
// What clients call
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Builds the config object a client adds to its `eslint.config.mjs`, after the shared `all` config.
 * The BASE restrictions are always on. Severity is always `error` and cannot be changed.
 *
 * Options, all optional:
 *   - `rollout`   ROLLOUT ids to enforce, listed in `@proton/oxlint-config/restrictedImports`. An unknown id throws.
 *   - `paths`     extra bans on an exact module specifier. Use `importNames` to ban only some named exports.
 *                 `{ name: 'lodash', importNames: ['get'], message: 'Use optional chaining.' }`
 *                 bans `import { get } from 'lodash'` but not `import { map } from 'lodash'`.
 *   - `patterns`  extra bans on every specifier matching a gitignore-style glob (`*` and `**`, `!` to re-allow).
 *                 `{ group: ['@proton/foo/*', '!@proton/foo/public'], message: 'Only /public is importable.' }`
 *   - `files`     globs the config applies to, default is every JS and TS file.
 *
 * Call it once per client. A second call for some `files` replaces the first call's `rollout`, `paths` and
 * `patterns` for those files (flat config behavior), so repeat them there. The base list is always kept.
 *
 * @param {{ rollout?: string[], paths?: RestrictedPath[], patterns?: RestrictedPattern[], files?: string[] }} [options]
 */
export function createRestrictedImportsConfig({ rollout = [], paths = [], patterns = [], files = allGlobs } = {}) {
    assertKnownRolloutIds(rollout);

    return defineConfig({
        name: 'restricted-imports',
        files,
        rules: {
            'proton/restricted-imports': ['error', { rollout, paths, patterns }],
        },
    });
}
