import { useEffect, useState } from 'react';

import { useUnleashClient } from '@unleash/proxy-client-react';

type SimpleFunc = () => void;

const readyCallbackSet: Set<SimpleFunc> = new Set();
const errorCallbackSet: Set<SimpleFunc> = new Set();

// Memoize initial states to keep value consistency between hook instances
let readyInitialState = false;
let errorInitialState = false;

/**
 * useFlagsReady
 *
 * @description
 * This hooks is a custom override of `useFlagsStatus` function from unleash React SDK.
 * Unleash React client `useFlagsStatus` hook:   https://github.com/Unleash/proxy-client-react/blob/main/src/useFlagsStatus.ts
 * Unleash React client context Provider:        https://github.com/Unleash/proxy-client-react/blob/main/src/FlagProvider.tsx
 *
 * It returns `flagsReady` and `flagsError` based on the `ready` and `error` Unleash JS client event emitter.
 * JS client: https://github.com/Unleash/unleash-proxy-client-js/blob/main/src/index.ts#L61
 *
 * Error event has an issue in the react client so in the meantime this stands as our own hotfix
 * https://github.com/Unleash/proxy-client-react/pull/127
 *
 * @returns {boolean}
 */
const useFlagsReady = () => {
    const client = useUnleashClient();
    const [isReady, setReady] = useState(readyInitialState);
    const [hasError, setError] = useState(errorInitialState);

    useEffect(() => {
        const readyListener = () => {
            readyCallbackSet.forEach((callback) => callback());
        };
        const readyCallback: SimpleFunc = () => {
            setReady(true);
            if (readyInitialState === false) {
                readyInitialState = true;
            }
        };
        const errorListener = () => {
            errorCallbackSet.forEach((callback) => callback());
        };
        const errorCallback: SimpleFunc = () => {
            setError(true);
            if (errorInitialState === false) {
                errorInitialState = true;
            }
        };

        if (readyCallbackSet.size === 0) {
            client.on('ready', readyListener);
            client.on('error', errorListener);
        }

        readyCallbackSet.add(readyCallback);
        errorCallbackSet.add(errorCallback);

        return () => {
            readyCallbackSet.delete(readyCallback);
            errorCallbackSet.delete(errorCallback);
            if (readyCallbackSet.size === 0) {
                client.off('ready', readyListener);
                client.off('error', errorListener);
            }
        };
    }, []);

    return isReady || hasError;
};

export default useFlagsReady;
