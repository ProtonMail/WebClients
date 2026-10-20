/** Name formats enforced by `proton/naming-convention`, the same as the former ESLint config. */
export const namingConventionOptions = [
    { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
    { selector: 'function', format: ['camelCase', 'PascalCase'] },
    { selector: 'typeLike', format: ['PascalCase', 'UPPER_CASE'] },
    { selector: 'enum', format: ['PascalCase', 'UPPER_CASE'] },
];
