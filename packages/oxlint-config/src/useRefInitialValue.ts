const message = 'Pass an initial value to `useRef`, for example `useRef<T>(undefined)`.';

/** The React 19 types require the argument of `useRef`. `useRef<T>(undefined)` has the same type as `useRef<T>()`. */
export const useRefInitialValueSelectors = [
    { selector: 'CallExpression[callee.name="useRef"][arguments.length=0]', message },
    { selector: 'CallExpression[callee.property.name="useRef"][arguments.length=0]', message },
];
