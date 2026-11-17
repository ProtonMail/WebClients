const message =
    'Type the reducer function instead of passing type arguments to `useReducer`. React 18 takes `useReducer<Reducer<S, A>>` and React 19 takes `useReducer<S, A>`.';

/** Each version of the React types rejects the type arguments of the other, while inference from a typed reducer works on both. */
export const useReducerTypeArgumentsSelectors = [
    { selector: 'CallExpression[callee.name="useReducer"][typeArguments]', message },
    { selector: 'CallExpression[callee.property.name="useReducer"][typeArguments]', message },
];
