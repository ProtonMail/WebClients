/**
 * https://github.com/dominictarr/hashlru with Map
 * @param {number} max
 * @param {function} [onDispose]
 * @return {{set, get, clear, has, delete}}
 */
const createLRU = ({ max, onDispose }) => {
    let size = 0;
    let cache = new Map();
    let oldCache = new Map();

    const update = (key, value) => {
        cache.set(key, value);
        size++;
        if (size >= max) {
            size = 0;
            const disposedCache = cache;
            oldCache = cache;
            cache = new Map();
            onDispose && onDispose(disposedCache);
        }
    };

    return {
        has: (key) => {
            return cache.has(key) || oldCache.has(key);
        },
        delete: (key) => {
            cache.delete(key);
            oldCache.delete(key);
        },
        get: (key) => {
            if (cache.has(key)) {
                return cache.get(key);
            }
            if (oldCache.has(key)) {
                const v = oldCache.get(key);
                update(key, v);
                return v;
            }
        },
        set: (key, value) => {
            if (cache.has(key)) {
                return cache.set(key, value);
            }
            return update(key, value);
        },
        clear: () => {
            cache = new Map();
            oldCache = new Map();
        },
        [Symbol.iterator]() {
            return cache[Symbol.iterator]();
        }
    };
};

export default createLRU;
