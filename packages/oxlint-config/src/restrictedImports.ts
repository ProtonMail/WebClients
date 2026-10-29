/**
 * Every restricted import in the repo, in one file, enforced by the `proton/restricted-imports` rule of both
 * linters: the ESLint one in `@proton/eslint-config-proton/restrictedImports` and the oxlint one in `./plugin`.
 * Both take the same options and merge them the same way with `collectRestrictions`.
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
 *   4. Merging, shared by both rules
 *   5. `createRestrictedImportRule`, what oxlint clients call
 *
 * @example client oxlint config
 * 'proton/restricted-imports': createRestrictedImportRule({
 *     paths: [{ name: 'some-package', importNames: ['oldHelper'], message: 'Use newHelper instead.' }],
 *     patterns: [{ group: ['@proton/foo/*'], message: 'Only the entry point is public.' }],
 * })
 */

// ---------------------------------------------------------------------------------------------------------------------
// 1. Types and shared values
// ---------------------------------------------------------------------------------------------------------------------

export interface RestrictedPath {
    name: string;
    importNames?: string[];
    message?: string;
    allowTypeImports?: boolean;
}

export interface RestrictedPattern {
    /** gitignore-style globs, `!` re-allows, matched case-insensitively. */
    group: string[];
    importNames?: string[];
    message?: string;
    allowTypeImports?: boolean;
}

export interface Restrictions {
    paths?: RestrictedPath[];
    patterns?: RestrictedPattern[];
}

interface BaseRestriction extends Restrictions {
    name: string;
    /** Narrows the entry to some files, receives the absolute file path. */
    appliesTo?: (filename: string) => boolean;
}

/**
 * Bans importing a package through its barrel (`index.ts`), which loads the whole package for one symbol and is the
 * main cause of slow tests.
 * `/index` and `/index.ts` load the same file as the bare specifier, but specifiers are matched exactly, so they
 * need their own entries or they would bypass the ban.
 */
function createBarrelRestrictions(packageName: string): Required<Pick<Restrictions, 'paths'>> {
    return {
        paths: [packageName, `${packageName}/index`, `${packageName}/index.ts`].map((name) => ({
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
// ---------------------------------------------------------------------------------------------------------------------

const BASE_RESTRICTIONS: BaseRestriction[] = [
    {
        // These packages have an explicit `exports` map, so their bare specifier no longer resolves.
        name: 'packages with an exports map have no barrel',
        paths: [
            '@proton/account',
            '@proton/activation',
            '@proton/ai-assistant',
            '@proton/app-context',
            '@proton/calendar',
            '@proton/calendar-video-conferencing',
            '@proton/challenge',
            '@proton/chargebee',
            '@proton/charts',
            '@proton/ci-pass',
            '@proton/ci-release',
            '@proton/ci-scripts',
            '@proton/ci-tools',
            '@proton/collect-metrics',
            '@proton/colors',
            '@proton/components',
            '@proton/console',
            '@proton/cross-storage',
            '@proton/docs-core',
            '@proton/docs-proto',
            '@proton/docs-shared',
            '@proton/drive',
            '@proton/drive-store',
            '@proton/encrypted-search',
            '@proton/eslint-config-proton',
            '@proton/features',
            '@proton/file-icons',
            '@proton/gitlab',
            '@proton/hooks',
            '@proton/key-transparency',
            '@proton/llm',
            '@proton/lumo-api-client',
            '@proton/lumo-ui',
            '@proton/mail',
            '@proton/mail-composer',
            '@proton/mail-message',
            '@proton/mail-renderer',
            '@proton/meet',
            '@proton/metrics',
            '@proton/nav',
            '@proton/offers-delivery',
            '@proton/oxlint-config',
            '@proton/pass',
            '@proton/payments',
            '@proton/payments-ui',
            '@proton/playwright-mocks',
            '@proton/raw-images',
            '@proton/react-redux-store',
            '@proton/recovery-kit',
            '@proton/redux-shared-store',
            '@proton/redux-shared-store-types',
            '@proton/redux-utilities',
            '@proton/sanitize',
            '@proton/shared',
            '@proton/sieve',
            '@proton/styles',
            '@proton/telemetry-tracker',
            '@proton/test-api',
            '@proton/test-tags-mr',
            '@proton/unleash',
            '@proton/utils',
            '@proton/vitest-config',
            '@proton/vpn',
            '@proton/wallet',
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
                group: [
                    '@proton/drive/*',
                    '!@proton/drive/index',
                    '!@proton/drive/sdk',
                    '!@proton/drive/public',
                    '!@proton/drive/public/**',
                ],
                message: 'Only `@proton/drive/sdk` and `@proton/drive/public/*` are public and importable.',
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

/**
 * BASE restrictions only the oxlint rule enforces, because they stand in for ESLint rules oxlint doesn't have.
 * ESLint workspaces keep enforcing them with the original rule.
 */
export const OXLINT_BASE_RESTRICTIONS: Restrictions = {
    // Stands in for `lodash/import-scope` with the `method` scope.
    paths: [
        {
            name: 'lodash',
            allowTypeImports: true,
            message: 'Import each lodash method from its own module, e.g. `lodash/debounce`.',
        },
    ],
};

// ---------------------------------------------------------------------------------------------------------------------
// 3. ROLLOUT restrictions
//
// Not clean on every client yet. A client opts in by listing the id in `rollout`, so adding one here never breaks a
// client that has not migrated. Once every client lists an id, move the entry to BASE and delete the id from the
// client configs.
//
// Available ids:
//   '<package>-barrel'         bans importing from the package root, so every import uses the full path
//                                bad:  import { Foo } from '@proton/account';
//                                good: import Foo from '@proton/account/path/to/Foo';
//                              Ids: none right now, every barrel ban is in the base list
// ---------------------------------------------------------------------------------------------------------------------

const ROLLOUT_RESTRICTIONS = {} satisfies Record<string, Restrictions>;

export type RolloutId = keyof typeof ROLLOUT_RESTRICTIONS;

export const rolloutIds = Object.keys(ROLLOUT_RESTRICTIONS) as RolloutId[];

// ---------------------------------------------------------------------------------------------------------------------
// 4. Merging, shared by both rules
// ---------------------------------------------------------------------------------------------------------------------

export interface RestrictedImportsOptions {
    rollout?: RolloutId[];
    paths?: RestrictedPath[];
    patterns?: RestrictedPattern[];
}

export function assertKnownRolloutIds(rollout: string[]) {
    const unknownIds = rollout.filter((id) => !rolloutIds.includes(id as RolloutId));
    if (unknownIds.length > 0) {
        throw new Error(
            `Unknown restricted imports rollout id: ${unknownIds.join(', ')}. Known: ${rolloutIds.join(', ')}`
        );
    }
}

/** Merges every restriction that applies to a file: base, then the client's rollout ids, then its own additions. */
export function collectRestrictions(
    filename: string,
    { rollout = [], paths = [], patterns = [] }: RestrictedImportsOptions
): Required<Restrictions> {
    const applicable: Restrictions[] = [
        ...BASE_RESTRICTIONS.filter(({ appliesTo }) => appliesTo?.(filename) ?? true),
        ...rollout.map((id) => ROLLOUT_RESTRICTIONS[id]),
        { paths, patterns },
    ];

    return {
        paths: applicable.flatMap((restrictions) => restrictions.paths ?? []),
        patterns: applicable.flatMap((restrictions) => restrictions.patterns ?? []),
    };
}

// ---------------------------------------------------------------------------------------------------------------------
// 5. What oxlint clients call
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Builds the `proton/restricted-imports` rule value for a client's `oxlint.config.mts`. The BASE restrictions are
 * always on. Severity is always `error` and cannot be changed. Options are the ESLint `createRestrictedImportsConfig`
 * ones, minus `files`: put the rule in an override for that.
 */
export function createRestrictedImportRule({
    rollout = [],
    paths = [],
    patterns = [],
}: RestrictedImportsOptions = {}): ['error', RestrictedImportsOptions] {
    assertKnownRolloutIds(rollout);
    return ['error', { rollout, paths, patterns }];
}
