const withoutJsxImport = 'Program:not(:has(ImportSpecifier[imported.name="JSX"]))';
const globalJsxMessage = "Import `JSX` from 'react' instead of using the global `JSX` namespace.";
const reactJsxMessage = "Import `JSX` from 'react' instead of using `React.JSX`.";

/**
 * React 19 removes the global `JSX` namespace from its types: `JSX` has to be imported by name from `react`.
 * A type reference is a `TSQualifiedName`, an interface `extends` or class `implements` clause a `MemberExpression`.
 */
export const jsxNamespaceSelectors = [
    {
        selector: `${withoutJsxImport} TSQualifiedName[left.type="Identifier"][left.name="JSX"]`,
        message: globalJsxMessage,
    },
    {
        selector: 'TSQualifiedName[left.type="Identifier"][left.name="React"][right.name="JSX"]',
        message: reactJsxMessage,
    },
    {
        selector: `${withoutJsxImport} MemberExpression[object.type="Identifier"][object.name="JSX"]`,
        message: globalJsxMessage,
    },
    {
        selector: 'MemberExpression[object.type="Identifier"][object.name="React"][property.name="JSX"]',
        message: reactJsxMessage,
    },
];
