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
 *     rollout: ['account-barrel', 'components-barrel'],
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

const COMPONENTS = '@proton/components';

export const iconRestrictedMessage =
    "Do not use the `Icon` component. Import the icon directly from `@proton/icons` instead, e.g. `import { IcThreeDotsHorizontal } from '@proton/icons/icons/IcThreeDotsHorizontal'`.";

/**
 * Bans importing a package through its barrel (`index.ts`), which loads the whole package for one symbol and is the
 * main cause of slow tests.
 * `/index` and `/index.ts` load the same file as the bare specifier, but specifiers are matched exactly, so they
 * need their own entries or they would bypass the ban.
 */
function createBarrelRestrictions(
    packageName: string,
    { includeBareSpecifier = true }: { includeBareSpecifier?: boolean } = {}
): Required<Pick<Restrictions, 'paths'>> {
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
// ---------------------------------------------------------------------------------------------------------------------

const BASE_RESTRICTIONS: BaseRestriction[] = [
    {
        // These packages have an explicit `exports` map, so their bare specifier no longer resolves.
        name: 'packages with an exports map have no barrel',
        paths: [
            '@proton/activation',
            '@proton/app-context',
            '@proton/calendar',
            '@proton/chargebee',
            '@proton/collect-metrics',
            '@proton/colors',
            '@proton/docs-proto',
            '@proton/drive',
            '@proton/features',
            '@proton/hooks',
            '@proton/lumo-api-client',
            '@proton/lumo-ui',
            '@proton/mail',
            '@proton/meet',
            '@proton/metrics',
            '@proton/pass',
            '@proton/payments',
            '@proton/payments-ui',
            '@proton/raw-images',
            '@proton/react-redux-store',
            '@proton/recovery-kit',
            '@proton/redux-shared-store',
            '@proton/redux-shared-store-types',
            '@proton/sanitize',
            '@proton/shared',
            '@proton/styles',
            '@proton/unleash',
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
//                                bad:  import { ModalTwo } from '@proton/components';
//                                good: import ModalTwo from '@proton/components/components/modalTwo/Modal';
//                              Ids: account-barrel, components-barrel, hooks-barrel
//   'icon-component'           bans the generic `<Icon name="..." />` component from @proton/components
//   'components-barrel-index'  temporary, packages/activation only, see its entry below
// ---------------------------------------------------------------------------------------------------------------------

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
} satisfies Record<string, Restrictions>;

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
