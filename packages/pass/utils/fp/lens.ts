import type { Maybe } from '@proton/pass/types';

type Obj = Record<string, any>;

interface PropFn {
    /* `<V extends T>` constraint ensures the input object satisfies the same
     * constraints as `T`. This maintains type safety when used in function
     * point-free style where the concrete type isn't known at the call site */
    <T extends Obj, K1 extends keyof T>(key: K1): <V extends T & { [Key in K1]?: any }>(obj: V) => V[K1];
    <T extends Obj, K1 extends keyof T, K2 extends keyof T[K1]>(
        key: K1,
        key2: K2
    ): <V extends T & { [Key in K1]?: { [Key in K2]?: any } }>(obj: V) => V[K1][K2];
    /* Add variadic overloads as necessary */
}

export const prop: PropFn =
    (...keys: string[]) =>
    <V extends Obj>(obj: V) =>
        keys.reduce((acc, key) => acc[key], obj);

export const cons =
    <T>(val: T) =>
    () =>
        val;

export const head = <T>(arr: ArrayLike<T>): Maybe<T> => arr?.[0];
export const last = <T>(arr: ArrayLike<T>): Maybe<T> => arr?.[arr.length - 1];
