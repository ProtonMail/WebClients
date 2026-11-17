const message = 'Type the props with TypeScript instead. React 19 ignores `propTypes`.';

/** React 19 drops `propTypes` checks for function and class components alike. */
export const propTypesSelectors = [
    { selector: 'AssignmentExpression[left.type="MemberExpression"][left.property.name="propTypes"]', message },
    { selector: 'PropertyDefinition[static=true][key.name="propTypes"]', message },
];
