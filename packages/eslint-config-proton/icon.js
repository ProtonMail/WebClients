import { defineConfig } from 'eslint/config';

import { allGlobs } from './globs.js';

export const iconComponentPath = '@proton/components/components/icon/Icon';
export const componentsPackage = '@proton/components';

const message =
    "Do not use the `Icon` component. Import the icon directly from `@proton/icons` instead, e.g. `import { IcThreeDotsHorizontal } from '@proton/icons/icons/IcThreeDotsHorizontal'`.";

/**
 * `no-restricted-imports` path entries that forbid the generic `<Icon name="..." />`
 * component in favor of the direct, tree-shakeable icon imports from `@proton/icons`.
 *
 * Exported separately so it can be merged into an existing `no-restricted-imports`
 * rule, since flat config replaces (does not merge) a rule's options on the last match.
 *
 * @example
 * // bad
 * import Icon from '@proton/components/components/icon/Icon';
 * import { Icon } from '@proton/components';
 *
 * // good
 * import { IcThreeDotsHorizontal } from '@proton/icons/icons/IcThreeDotsHorizontal';
 */
export const iconRestrictedImports = [
    {
        name: iconComponentPath,
        message,
    },
    {
        name: componentsPackage,
        importNames: ['Icon'],
        message,
    },
];

/**
 * Creates a standalone config that forbids using the generic `Icon` component.
 * Use this in packages that don't already define their own `no-restricted-imports`
 * rule; otherwise merge `iconRestrictedImports` into the existing rule.
 */
export function createIconConfig(options = {}) {
    const files = options.files || allGlobs;
    const severity = options.severity || 'error';

    return defineConfig({
        name: 'icon-import-rules',
        files,
        rules: {
            'no-restricted-imports': [severity, { paths: iconRestrictedImports }],
        },
    });
}

export default createIconConfig();
