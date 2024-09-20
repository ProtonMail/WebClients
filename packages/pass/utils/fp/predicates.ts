import type { Maybe, Unpack } from '@proton/pass/types';

export type Predicate<T extends any[] = any[]> = (...a: T) => boolean;
export type TypePredicate<A, B extends A> = (a: A) => a is B;

export type PredicateCombinator<P extends Predicate<any>, T extends P[], R = Unpack<T>> =
    R extends TypePredicate<infer A, infer B>
        ? (a: A) => a is B
        : R extends (a: infer A) => boolean
          ? (a: A) => boolean
          : never;

export const or = <P extends Predicate<any>, T extends P[]>(...guards: T) =>
    ((arg: any) => guards.some((guard) => guard(arg))) as PredicateCombinator<P, T>;

export const and = <P extends Predicate<any>, T extends P[]>(...guards: T) =>
    ((arg: any) => guards.every((guard) => guard(arg))) as PredicateCombinator<P, T>;

/* inverts a predicate function :
 * const isPositive = (x: number) => x >= 0;
 * [-1, 0, 1].filter(not(isPositive)) */
export const not =
    <T extends Predicate = Predicate>(predicate: T): ((...args: Parameters<T>) => boolean) =>
    (...args: Parameters<T>) =>
        !predicate(...args);

export const oneOf =
    <T extends any>(...args: T[]) =>
    (value: T): boolean =>
        args.includes(value);

export const partOf =
    (...args: Maybe<string>[]) =>
    (value: string): boolean =>
        args.some((param) => param?.toLowerCase().includes(value?.toLowerCase()));

export const eq =
    <T extends any>(a: T) =>
    (b: T): boolean =>
        a === b;

export const truthy = <T>(value: T | undefined | null | false): value is T => Boolean(value);

export const notIn =
    <T extends any>(haystack: T[]) =>
    (item: T): boolean =>
        !haystack.includes(item);
