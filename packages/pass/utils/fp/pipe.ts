export { default as pipe } from 'lodash/flow';

export const tap =
    <A, P = A extends Promise<infer U> ? U : A>(effect: (arg: P) => void) =>
    (arg: A): A => {
        if (typeof (arg as any)?.then === 'function') {
            return (arg as Promise<P>).then((awaited) => {
                effect(awaited);
                return awaited;
            }) as A;
        }

        effect(arg as any);
        return arg;
    };

export const orThrow =
    <A extends any[], R extends any, E extends string>(
        errorMessage: E,
        predicate: (...args: A) => boolean,
        fn: (...args: A) => R
    ): ((...args: A) => R) =>
    (...args: A) => {
        if (!predicate(...args)) {
            throw new Error(errorMessage);
        }

        return fn?.(...args);
    };
