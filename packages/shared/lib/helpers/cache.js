import createListeners from './listeners';

/**
 * Wraps a map with support for subscribe/unsubscribe on changes.
 * @param {{set, get, clear, has, delete}} [map]
 * @return {{set, subscribe, get, reset, has, toObject, delete}}
 */
const createCache = (map = new Map()) => {
    const listeners = createListeners();

    const set = (key, value) => {
        map.set(key, value);
        listeners.notify(key, value);
    };

    const remove = (key) => {
        map.delete(key);
        listeners.notify(key, undefined);
    };

    const reset = () => {
        listeners.clear();
        map.clear();
    };

    const get = (key) => map.get(key);
    const has = (key) => map.has(key);

    const toObject = () => {
        return Array.from(map).reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
    };

    return {
        set,
        get,
        has,
        toObject,
        delete: remove,
        subscribe: listeners.subscribe,
        notify: listeners.notify,
        reset
    };
};

export default createCache;
