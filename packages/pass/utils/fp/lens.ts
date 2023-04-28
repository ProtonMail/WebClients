export const prop =
    <T extends { [key: string]: any }, K extends keyof T>(key: K) =>
    (obj: T): T[K] =>
        obj[key];

export const withPayload =
    <T extends { payload: any }, F extends (payload: T['payload']) => any>(fn: F) =>
    (obj: T): ReturnType<F> =>
        fn(obj.payload);

export const withPayloadLens =
    <
        T extends { payload: { [key: string]: any } },
        K extends keyof T['payload'],
        F extends (payload: T['payload'][K]) => any
    >(
        prop: K,
        fn: F
    ) =>
    (obj: T): ReturnType<F> =>
        fn(obj.payload[prop as any]);
