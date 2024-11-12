type Obj = Record<string, any>;

interface PropFn {
    /* `<V extends T>` constraint ensures the input object satisfies the same
     * constraints as `T`. This maintains type safety when used in function
     * point-free style where the concrete type isn't known at the call site */
    <T extends Obj, K1 extends keyof T>(key: K1): <V extends T>(obj: V) => V[K1];
    <T extends Obj, K1 extends keyof T, K2 extends keyof T[K1]>(key: K1, key2: K2): <V extends T>(obj: V) => V[K1][K2];
    /* Add variadic overloads as necessary */
}

export const prop: PropFn =
    (...keys: string[]) =>
    <V extends Obj>(obj: V) =>
        keys.reduce((acc, key) => acc[key], obj);

export const withPayload =
    <T extends { payload: any }, F extends (payload: T['payload']) => any>(fn: F) =>
    (obj: T): ReturnType<F> =>
        fn(obj.payload);

export const withPayloadLens =
    <
        T extends { payload: { [key: string]: any } },
        K extends keyof T['payload'],
        F extends (payload: T['payload'][K]) => any,
    >(
        prop: K,
        fn: F
    ) =>
    (obj: T): ReturnType<F> =>
        fn(obj.payload[prop as any]);
