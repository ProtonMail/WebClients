import createListeners from './listeners';

const createCache = () => {
    const map = new Map();
    const listeners = createListeners();

    const set = (key, value) => {
        map.set(key, value);
        listeners.notify(key, value, map);
    };

    const remove = (key) => {
        map.delete(key);
        listeners.notify(key, undefined, map);
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
        reset
    };
};

export default createCache;
