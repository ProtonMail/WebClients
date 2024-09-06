import { defaultExpiry, getFetchedEphemeral as defaultGetFetchedEphemeral, isNotStale } from './fetchedAt';
import { CacheType, type ReducerValue } from './interface';

const context: { cache?: CacheType; fetchedEphemeral: ReturnType<typeof defaultGetFetchedEphemeral> } = {
    cache: CacheType.StaleRefetch,
    fetchedEphemeral: defaultGetFetchedEphemeral(),
};

export const configureCache = ({
    cache = CacheType.StaleRefetch,
    getFetchedEphemeral = defaultGetFetchedEphemeral,
}: {
    cache?: CacheType;
    getFetchedEphemeral?: typeof defaultGetFetchedEphemeral;
}) => {
    context.cache = cache;
    context.fetchedEphemeral = getFetchedEphemeral();
};

export const getIsStaleRefetch = (
    fetchedEphemeral: ReturnType<typeof defaultGetFetchedEphemeral> | undefined,
    cache: CacheType
) => {
    return cache === CacheType.StaleRefetch && fetchedEphemeral !== context.fetchedEphemeral;
};

export const cacheHelper = <Returned>({
    store,
    key,
    select,
    cb,
    cache = context.cache,
    expiry = defaultExpiry,
}: {
    store: {
        get: (key: string) => Promise<Returned> | undefined;
        set: (key: string, promise: Promise<Returned>) => void;
    };
    key?: any;
    select: () => ReducerValue<Returned> | undefined;
    cb: () => Promise<Returned>;
    cache?: CacheType;
    expiry?: number;
}): Promise<Returned> => {
    const promise = store.get(key);
    if (promise) {
        return promise;
    }
    if (cache === CacheType.Stale || cache === CacheType.StaleRefetch) {
        const state = select();
        if (state && state.value !== undefined && isNotStale(state.meta.fetchedAt, expiry)) {
            if (getIsStaleRefetch(state.meta.fetchedEphemeral, cache)) {
                const newPromise = cb();
                store.set(key, newPromise);
            }
            return Promise.resolve(state.value);
        }
    }
    const newPromise = cb();
    store.set(key, newPromise);
    return newPromise;
};

export const createPromiseStore = <Returned>() => {
    let promise: Promise<Returned> | undefined = undefined;

    const set = (key: string, newPromise: Promise<Returned>) => {
        promise = newPromise;
        newPromise
            .finally(() => {
                promise = undefined;
            })
            .catch(() => {});
    };

    const get = () => promise;

    return { get, set };
};

export const createPromiseMapStore = <Returned>() => {
    const map = new Map<string, Promise<Returned>>();

    const set = (id: string, newPromise: Promise<Returned>) => {
        map.set(id, newPromise);
        newPromise
            .finally(() => {
                map.delete(id);
            })
            .catch(() => {});
    };

    const get = (id: string) => map.get(id);

    return { get, set };
};
