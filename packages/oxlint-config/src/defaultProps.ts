const message =
    'Use default values in the props destructuring instead. React 19 ignores `defaultProps` on function components.';

/** Class components keep `static defaultProps` in React 19, so only the assignment form is reported. */
export const defaultPropsSelectors = [
    { selector: 'AssignmentExpression[left.type="MemberExpression"][left.property.name="defaultProps"]', message },
];
