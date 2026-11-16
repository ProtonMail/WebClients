import { jsxNamespaceSelectors } from './jsxNamespace.ts';
import { useRefInitialValueSelectors } from './useRefInitialValue.ts';

/**
 * `proton/restricted-syntax` selectors for code the React 19 types reject. A config that sets its own
 * `proton/restricted-syntax` list replaces the shared one, so it has to spread these in again.
 */
export const react19Selectors = [...jsxNamespaceSelectors, ...useRefInitialValueSelectors];
