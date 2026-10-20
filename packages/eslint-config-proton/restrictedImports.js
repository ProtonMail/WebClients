/**
 * Every restricted import in the repo, in one file, enforced by the `proton/restricted-imports` rule.
 *
 * Why not `no-restricted-imports`: flat config replaces a rule's options for each file instead of merging them, so
 * any config setting that rule dropped every restriction set elsewhere. This rule keeps the shared lists inside
 * itself and clients only pass additions, so they cannot remove a shared restriction by accident.
 * Matching is delegated to `@typescript-eslint/no-restricted-imports`, so `paths`, `patterns`, `importNames`
 * and `export ... from` behave exactly like the built-in rule.
 *
 * Three kinds of restrictions, from strictest to loosest:
 *   - BASE      enforced on every client, no opt-out
 *   - ROLLOUT   enforced on the clients that list its id in `rollout`
 *   - CLIENT    `paths` and `patterns` passed by a client for its own needs
 *
 * File layout, top to bottom:
 *   1. Types and shared values
 *   2. BASE restrictions
 *   3. ROLLOUT restrictions
 *   4. The rule and its plugin
 *   5. `createRestrictedImportsConfig`, the only function clients call
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

import { allGlobs } from './globs.js';

// ---------------------------------------------------------------------------------------------------------------------
// 1. Types and shared values
// ---------------------------------------------------------------------------------------------------------------------

/**
 * @typedef {{ name: string, importNames?: string[], message?: string }} RestrictedPath
 * @typedef {{ group: string[], importNames?: string[], message?: string }} RestrictedPattern
 * @typedef {{ paths?: RestrictedPath[], patterns?: RestrictedPattern[] }} Restrictions
 * @typedef {Restrictions & { name: string, appliesTo?: (filename: string) => boolean }} BaseRestriction
 */

const COMPONENTS = '@proton/components';

export const iconRestrictedMessage =
    "Do not use the `Icon` component. Import the icon directly from `@proton/icons` instead, e.g. `import { IcThreeDotsHorizontal } from '@proton/icons/icons/IcThreeDotsHorizontal'`.";

/**
 * Bans importing a package through its barrel (`index.ts`), which loads the whole package for one symbol and is the
 * main cause of slow tests.
 * `/index` and `/index.ts` load the same file as the bare specifier, but specifiers are matched exactly, so they
 * need their own entries or they would bypass the ban.
 * @param {string} packageName
 * @param {{ includeBareSpecifier?: boolean }} [options]
 * @returns {Restrictions}
 */
function createBarrelRestrictions(packageName, { includeBareSpecifier = true } = {}) {
    const specifiers = [`${packageName}/index`, `${packageName}/index.ts`];
    if (includeBareSpecifier) {
        specifiers.unshift(packageName);
    }
    return {
        paths: specifiers.map((name) => ({
            name,
            message: 'You should avoid barrel imports. Prefer full path imports.',
        })),
    };
}

// ---------------------------------------------------------------------------------------------------------------------
// 2. BASE restrictions
//
// Enforced on every client. To add one that is not clean everywhere yet, put it in ROLLOUT first and move it here
// once every client lists its id (then delete the id from the client configs).
// `appliesTo` narrows an entry to some files, it receives the absolute file path.
// ---------------------------------------------------------------------------------------------------------------------

/** @type {BaseRestriction[]} */
const BASE_RESTRICTIONS = [
    {
        // These packages have an explicit `exports` map, so their bare specifier no longer resolves.
        name: 'packages with an exports map have no barrel',
        paths: [
            '@proton/chargebee',
            '@proton/collect-metrics',
            '@proton/colors',
            '@proton/docs-proto',
            '@proton/metrics',
            '@proton/raw-images',
            '@proton/react-redux-store',
            '@proton/recovery-kit',
            '@proton/sanitize',
            '@proton/shared',
            '@proton/styles',
        ].flatMap((packageName) => createBarrelRestrictions(packageName).paths),
    },
    {
        name: 'reselect',
        paths: [
            {
                name: 'reselect',
                importNames: ['createSelector'],
                message: 'Please use createSelector from @redux/toolkit instead.',
            },
        ],
    },
    {
        name: 'monorepo packages are imported by their @proton name, not their folder',
        patterns: [{ group: ['packages/'], message: 'You should import from `@proton/` instead.' }],
    },
    {
        name: 'index files that must be imported through the bare package name',
        patterns: [
            { group: ['@proton/unleash/index'], message: 'You should import from `@proton/unleash` instead.' },
            { group: ['@proton/mail/index'], message: 'You should import from `@proton/mail` instead.' },
        ],
    },
    {
        name: '@proton/atoms is imported by full path, never through its barrel',
        ...createBarrelRestrictions('@proton/atoms'),
    },
    {
        name: '@proton/icons is imported by full path, never through its barrel',
        ...createBarrelRestrictions('@proton/icons'),
    },
    {
        name: 'only the public surface of @proton/drive is importable',
        // applications/drive and packages/drive-store own the drive code and have their own fence, see their eslint
        // configs.
        appliesTo: (filename) =>
            !['/applications/drive/', '/packages/drive-store/'].some((folder) => filename.includes(folder)),
        patterns: [
            {
                group: ['@proton/drive/*', '!@proton/drive/index', '!@proton/drive/public', '!@proton/drive/public/**'],
                message: 'Only `@proton/drive` (index) and `@proton/drive/public/*` are public and importable.',
            },
        ],
    },
    {
        name: 'nothing may import from the mail application',
        patterns: [
            {
                group: ['proton-mail/*'],
                message:
                    'Packages and apps must not import from applications/mail. Extract shared code into @proton/mail or @proton/shared.',
            },
        ],
    },
    {
        name: 'a silent api must come from a hook, in components only',
        appliesTo: (filename) => /\.[jt]sx$/.test(filename),
        patterns: [
            {
                group: ['@proton/shared/lib/api/helpers/customConfig'],
                importNames: ['getSilentApi'],
                message: 'Use the useSilentApi hook instead',
            },
        ],
    },
];

// ---------------------------------------------------------------------------------------------------------------------
// 3. ROLLOUT restrictions
//
// Not clean on every client yet. A client opts in by listing the id in `rollout`, so adding one here never breaks a
// client that has not migrated. Once every client lists an id, move the entry to BASE and delete the id from the
// client configs.
//
// Available ids:
//   '<package>-barrel'         bans importing from the package root, so every import uses the full path
//                                bad:  import { ModalTwo } from '@proton/components';
//                                good: import ModalTwo from '@proton/components/components/modalTwo/Modal';
//                              Ids: account-barrel, components-barrel, hooks-barrel
//   'icon-component'           bans the generic `<Icon name="..." />` component from @proton/components
//   'components-barrel-index'  temporary, packages/activation only, see its entry below
// ---------------------------------------------------------------------------------------------------------------------

/** @type {Record<string, Restrictions>} */
const ROLLOUT_RESTRICTIONS = {
    'account-barrel': createBarrelRestrictions('@proton/account'),
    'components-barrel': createBarrelRestrictions(COMPONENTS),
    'hooks-barrel': createBarrelRestrictions('@proton/hooks'),

    // The generic `<Icon name="..." />` component, replaced by direct imports from @proton/icons.
    //   bad:  import { Icon } from '@proton/components';
    //   good: import { IcThreeDotsHorizontal } from '@proton/icons/icons/IcThreeDotsHorizontal';
    'icon-component': {
        paths: [
            { name: `${COMPONENTS}/components/icon/Icon`, message: iconRestrictedMessage },
            { name: COMPONENTS, importNames: ['Icon'], message: iconRestrictedMessage },
        ],
    },

    // Temporary, only for packages/activation: it still imports the bare `@proton/components` barrel, so only the
    // `/index` specifiers are banned there. Delete with the activation migration.
    'components-barrel-index': createBarrelRestrictions(COMPONENTS, { includeBareSpecifier: false }),
};

const rolloutIds = Object.keys(ROLLOUT_RESTRICTIONS);

// ---------------------------------------------------------------------------------------------------------------------
// 4. The rule and its plugin
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Merges every restriction that applies to a file: base, then the client's rollout ids, then its own additions.
 * @param {string} filename absolute path
 * @param {{ rollout: string[], paths: RestrictedPath[], patterns: RestrictedPattern[] }} clientOptions
 * @returns {Required<Restrictions>}
 */
function collectRestrictions(filename, { rollout, paths, patterns }) {
    const applicable = [
        ...BASE_RESTRICTIONS.filter(({ appliesTo }) => appliesTo?.(filename) ?? true),
        ...rollout.map((id) => ROLLOUT_RESTRICTIONS[id]),
        { paths, patterns },
    ];

    return {
        paths: applicable.flatMap((restrictions) => restrictions.paths ?? []),
        patterns: applicable.flatMap((restrictions) => restrictions.patterns ?? []),
    };
}

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
// 5. What clients call
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Builds the config object a client adds to its `eslint.config.mjs`, after the shared `all` config.
 * The BASE restrictions are always on. Severity is always `error` and cannot be changed.
 *
 * Options, all optional:
 *   - `rollout`   ROLLOUT ids to enforce, listed in section 3. An unknown id throws.
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
    const unknownIds = rollout.filter((id) => !rolloutIds.includes(id));
    if (unknownIds.length > 0) {
        throw new Error(
            `Unknown restricted imports rollout id: ${unknownIds.join(', ')}. Known: ${rolloutIds.join(', ')}`
        );
    }

    return defineConfig({
        name: 'restricted-imports',
        files,
        rules: {
            'proton/restricted-imports': ['error', { rollout, paths, patterns }],
        },
    });
}
