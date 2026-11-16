const message =
    'Type the ref as `RefObject<T | null>`, or as `Ref<T>` when it is only forwarded to a `ref` attribute. With the React 19 types, `useRef<T>(null)` is not assignable to `RefObject<T>`.';

const argument = 'typeArguments.params.0.type';
// `RefObject<T>` and `React.RefObject<T>`, each with an argument that is not a union or is a union without `null`.
const selectors = ['typeName.name', 'typeName.right.name'].flatMap((name) => [
    `TSTypeReference[${name}="RefObject"][typeArguments][${argument}!="TSUnionType"][${argument}!="TSAnyKeyword"]`,
    `TSTypeReference[${name}="RefObject"][${argument}="TSUnionType"]:not(:has(TSNullKeyword))`,
]);

/**
 * `proton/restricted-syntax` selectors for `RefObject<T>` annotations that cannot take `useRef<T>(null)`
 * with the React 19 types. Not part of `react19Selectors` yet: a package turns them on once it is clean.
 */
export const refObjectNullSelectors = selectors.map((selector) => ({ selector, message }));
