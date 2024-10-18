import { default as flow } from 'lodash/flow';

/** The default `flow` type is unsafe, allowing invalid compositions due to:
 * `flow(...func: Array<Many<(...args: any[]) => any>>): (...args: any[]) => any`
 * This can cause runtime errors TypeScript can't catch. We define a stricter
 * variadic 'Pipe' interface to address this issue. */
interface Pipe {
    <A extends any[], R1, R2, R3, R4, R5, R6, R7>(
        f1: (...args: A) => R1,
        f2: (a: R1) => R2,
        f3: (a: R2) => R3,
        f4: (a: R3) => R4,
        f5: (a: R4) => R5,
        f6: (a: R5) => R6,
        f7: (a: R6) => R7
    ): (...args: A) => R7;
    <A extends any[], R1, R2, R3, R4, R5, R6>(
        f1: (...args: A) => R1,
        f2: (a: R1) => R2,
        f3: (a: R2) => R3,
        f4: (a: R3) => R4,
        f5: (a: R4) => R5,
        f6: (a: R5) => R6
    ): (...args: A) => R6;
    <A extends any[], R1, R2, R3, R4, R5>(
        f1: (...args: A) => R1,
        f2: (a: R1) => R2,
        f3: (a: R2) => R3,
        f4: (a: R3) => R4,
        f5: (a: R4) => R5
    ): (...args: A) => R5;
    <A extends any[], R1, R2, R3, R4>(
        f1: (...args: A) => R1,
        f2: (a: R1) => R2,
        f3: (a: R2) => R3,
        f4: (a: R3) => R4
    ): (...args: A) => R4;
    <A extends any[], R1, R2, R3>(f1: (...args: A) => R1, f2: (a: R1) => R2, f3: (a: R2) => R3): (...args: A) => R3;
    <A extends any[], R1, R2>(f1: (...args: A) => R1, f2: (a: R1) => R2): (...args: A) => R2;
    <A extends any[], R1>(f1: (...args: A) => R1): (...args: A) => R1;
}

export const pipe = flow as Pipe;

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

export const withTap =
    <Effect extends () => void>(effect: Effect) =>
    <Fn extends () => void>(fn: Fn) =>
        pipe(fn, tap(effect)) as Fn;
