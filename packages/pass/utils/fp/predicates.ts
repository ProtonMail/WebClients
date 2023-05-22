import type { Unpack } from '@proton/pass/types';

type Predicate<Params extends any[] = any[]> = (...args: Params) => boolean;

/* inverts a predicate function :
 * const isPositive = (x: number) => x >= 0;
 * [-1, 0, 1].filter(invert(isPositive)) */
export const invert =
    <T extends Predicate = Predicate>(predicate: T): ((...args: Parameters<T>) => boolean) =>
    (...args: Parameters<T>) =>
        !predicate(...args);

export const or =
    <T extends Predicate[] = Predicate[], P extends Predicate = Unpack<T>>(
        ...predicates: T
    ): ((...args: Parameters<P>) => boolean) =>
    (...args: Parameters<P>) =>
        predicates.some((fn) => fn(...args));

export const and =
    <T extends Predicate[] = Predicate[], P extends Predicate = Unpack<T>>(
        ...predicates: T
    ): ((...args: Parameters<P>) => boolean) =>
    (...args: Parameters<P>) =>
        predicates.every((fn) => fn(...args));

export const oneOf =
    <T extends any>(...args: T[]) =>
    (value: T): boolean =>
        args.includes(value);

export const truthy = <T>(value: T | undefined | null | false): value is T => Boolean(value);

export const notIn =
    <T extends any>(haystack: T[]) =>
    (item: T): boolean =>
        !haystack.includes(item);
