import { useEffect, useState } from 'react';

import { useUnleashClient } from '@unleash/proxy-client-react';

type SimpleFunc = () => void;

const readyCallbackSet: Set<SimpleFunc> = new Set();
const errorCallbackSet: Set<SimpleFunc> = new Set();

/**
 * useFlagsReady
 * @description is an override we use to ensure that the flags are well loaded
 * or not loaded at all before rendering the app.
 * @returns {boolean}
 */
const useFlagsReady = () => {
    const client = useUnleashClient();
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const readyListener = () => {
            readyCallbackSet.forEach((callback) => callback());
        };
        const readyCallback: SimpleFunc = () => {
            setReady(true);
        };
        const errorListener = () => {
            errorCallbackSet.forEach((callback) => callback());
        };
        const errorCallback: SimpleFunc = () => {
            setError(true);
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

    return ready || error;
};

export default useFlagsReady;
