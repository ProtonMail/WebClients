import createListeners, { Listeners } from './listeners';

export interface Cache<K, V> extends Pick<Listeners<[K, V | undefined], void>, 'subscribe'>, Map<K, V> {
    clearListeners: () => void;
}

/**
 * Wraps a map with support for subscribe/unsubscribe on changes.
 */
const createCache = <K, V>(map = new Map<K, V>()): Cache<K, V> => {
    const listeners = createListeners<[K, V | undefined], void>();
    return {
        get size() {
            return map.size;
        },
        forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any) {
            return map.forEach(callbackfn, thisArg);
        },
        has: (key: K) => map.has(key),
        get: (key: K) => map.get(key),
        entries: () => map.entries(),
        keys: () => map.keys(),
        values: () => map.values(),
        [Symbol.iterator]: () => map[Symbol.iterator](),
        get [Symbol.toStringTag]() {
            return map[Symbol.toStringTag];
        },
        clear: () => map.clear(),
        delete: (key: K) => {
            const r = map.delete(key);
            listeners.notify(key, undefined);
            return r;
        },
        set(key: K, value: V) {
            map.set(key, value);
            listeners.notify(key, value);
            return this;
        },
        subscribe: listeners.subscribe,
        clearListeners: listeners.clear,
    };
};

export default createCache;
