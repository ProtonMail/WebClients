interface Args<K, V> {
    max: number;
    onDispose?: ([key, value]: [K, V | undefined]) => void;
}

function createLRU<K, V>({ max, onDispose }: Args<K, V>): Map<K, V> {
    const map = new Map<K, V>();

    const getOldestKey = () => map.keys().next().value;

    return {
        get size() {
            return map.size;
        },
        forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any) {
            return map.forEach(callbackfn, thisArg);
        },
        clear: () => map.clear(),
        has: (key: K) => map.has(key),
        delete: (key: K) => map.delete(key),
        entries: () => map.entries(),
        keys: () => map.keys(),
        values: () => map.values(),
        [Symbol.iterator]: () => map[Symbol.iterator](),
        get [Symbol.toStringTag]() {
            return map[Symbol.toStringTag];
        },
        set: (key: K, value: V) => {
            if (map.has(key)) {
                map.delete(key);
            } else if (map.size === max) {
                const keyToDispose = getOldestKey();
                const valueToDispose = map.get(keyToDispose);
                map.delete(keyToDispose);
                if (onDispose) {
                    onDispose([keyToDispose, valueToDispose]);
                }
            }
            map.set(key, value);
            return map;
        },
        get: (key: K) => {
            const item = map.get(key);
            if (!item) {
                return undefined;
            }
            map.delete(key);
            map.set(key, item);
            return item;
        },
    };
}

export default createLRU;
