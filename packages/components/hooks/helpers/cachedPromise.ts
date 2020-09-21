import { Cache } from 'proton-shared/lib/helpers/cache';

type CacheValue<V, D> =
    | {
          dependency: D;
          promise: Promise<V>;
      }
    | {
          dependency: D;
          result: V;
      };

/**
 * Cache a promise by a key, and re-run it when the dependency changes.
 */
export const cachedPromise = <K, V, D>(
    cache: Cache<K, CacheValue<V, D>>,
    key: K,
    miss: () => Promise<V>,
    dependency: D
) => {
    const cachedValue = cache.get(key);
    if (cachedValue) {
        const { dependency: oldDependency } = cachedValue;

        if (dependency === oldDependency) {
            return 'promise' in cachedValue ? cachedValue.promise : Promise.resolve(cachedValue.result);
        }
    }

    const promise = miss();

    cache.set(key, {
        dependency,
        promise,
    });

    promise.then((result) => {
        const cachedValue = cache.get(key);

        if (!cachedValue) {
            throw new Error(`Cached value for ${key} was overwritten unexpectedly`);
        }

        if ('promise' in cachedValue && promise !== cachedValue.promise) {
            return result;
        }

        cache.set(key, {
            dependency,
            result,
        });

        return result;
    });

    return promise;
};
