export const restrictedImports = {
    paths: [
        {
            name: 'reselect',
            importNames: ['createSelector'],
            message: 'Please use createSelector from @redux/toolkit instead.',
        },
    ],

    patterns: [
        {
            group: ['packages/'],
            message: 'You should import from `@proton/` instead.',
        },
        {
            group: ['@proton/unleash/index'],
            message: 'You should import from `@proton/unleash` instead.',
        },
        {
            group: ['@proton/mail/index'],
            message: 'You should import from `@proton/mail` instead.',
        },
        {
            group: ['@proton/drive/*', '!@proton/drive/index', '!@proton/drive/public', '!@proton/drive/public/**'],
            message: 'Only `@proton/drive` (index) and `@proton/drive/public/*` are public and importable.',
        },
    ],
};

// Extra `no-restricted-imports` patterns scoped to `.tsx`/`.jsx` files, opted into with the `tsx`
// option of `createRestrictedImportRule`.
export const tsxRestrictedImportPatterns = [
    {
        group: ['@proton/shared/lib/api/helpers/customConfig'],
        importNames: ['getSilentApi'],
        message: 'Use the useSilentApi hook instead',
    },
];

/**
 * Builds a `no-restricted-imports` rule value that always includes `restrictedImports` on top of
 * the given additions. Flat config replaces a rule's options wholesale per matching file rather
 * than merging across config objects, so any config setting this rule itself would otherwise
 * silently drop the shared restrictions.
 *
 * Severity is deliberately not an option: the rule takes a single severity for every path and
 * pattern it carries, so letting callers lower it would downgrade the shared restrictions too.
 *
 * The return type is annotated as a tuple rather than inferred: eslint's `RuleConfig` requires
 * `[Severity, ...unknown[]]`, and an inferred return loses the tuple-ness that an inline array
 * literal would have picked up contextually at the assignment site.
 *
 * @example
 * 'no-restricted-imports': createRestrictedImportRule({ paths: createBarrelPaths(), patterns: [ownPattern] })
 *
 * @returns {['error', { paths: unknown[]; patterns: unknown[] }]}
 */
export function createRestrictedImportRule({ paths = [], patterns = [], tsx = false } = {}) {
    return [
        'error',
        {
            paths: [...restrictedImports.paths, ...paths],
            patterns: [...restrictedImports.patterns, ...patterns, ...(tsx ? tsxRestrictedImportPatterns : [])],
        },
    ];
}
