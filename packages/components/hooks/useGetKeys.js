import { useCache, useAuthenticationStore } from 'react-components';
import { prepareKeys } from 'proton-shared/lib/keys/keys';

/**
 * Hook that exposes a function that lets one get the keys for an address or user, with support for caching.
 * @return {Function}
 */
const useGetKeys = () => {
    const cache = useCache();
    const authenticationStore = useAuthenticationStore();

    return (ID, Keys, OrganizationPrivateKey) => {
        if (cache.has(ID)) {
            const { dependency: oldDependency, promise, result } = cache.get(ID);
            if (Keys === oldDependency) {
                return promise || Promise.resolve(result);
            }
        }

        const promise = prepareKeys({
            Keys,
            keyPassword: authenticationStore.getPassword(),
            OrganizationPrivateKey
        });

        cache.set(ID, {
            dependency: Keys,
            promise
        });
        promise.then((result) => {
            const { promise: oldPromise } = cache.get(ID);
            if (promise !== oldPromise) {
                return result;
            }
            cache.set(ID, {
                dependency: Keys,
                result
            });
            return result;
        });

        return promise;
    };
};

export default useGetKeys;
