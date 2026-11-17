import type { OxlintOverride } from 'oxlint';

import { brandNameSelectors } from './brandNames.ts';
import { defaultPropsSelectors } from './defaultProps.ts';
import { typescriptGlobs } from './globs.ts';
import { jsxNamespaceSelectors } from './jsxNamespace.ts';
import { propTypesSelectors } from './propTypes.ts';
import { refBeforePropsSpreadSelectors } from './refBeforePropsSpread.ts';
import { refObjectNullSelectors } from './refObjectNull.ts';
import { useReducerTypeArgumentsSelectors } from './useReducerTypeArguments.ts';
import { useRefInitialValueSelectors } from './useRefInitialValue.ts';

/**
 * `proton/restricted-syntax` selectors for code the React 19 types reject. A config that sets its own
 * `proton/restricted-syntax` list replaces the shared one, so it has to spread these in again.
 */
export const react19Selectors = [
    ...jsxNamespaceSelectors,
    ...useRefInitialValueSelectors,
    ...useReducerTypeArgumentsSelectors,
    ...defaultPropsSelectors,
    ...propTypesSelectors,
    ...refBeforePropsSpreadSelectors,
];

/**
 * Override for a package whose `RefObject` annotations already work with the React 19 types. Once every
 * package has it, `refObjectNullSelectors` moves into `react19Selectors` and this goes away.
 */
export const refObjectNullOverride: OxlintOverride = {
    files: typescriptGlobs,
    rules: {
        'proton/restricted-syntax': ['error', ...brandNameSelectors, ...react19Selectors, ...refObjectNullSelectors],
    },
};
