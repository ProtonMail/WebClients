import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useEffect } from 'react';

import FlagProvider from '@unleash/proxy-client-react';
import { useUnleashClient } from '@unleash/proxy-client-react';
import type { IConfig, UnleashClient } from 'unleash-proxy-client';

import { createPromise } from '@proton/shared/lib/helpers/promise';
import type { Api } from '@proton/shared/lib/interfaces';

import useApi from '../../hooks/useApi';
import ProtonUnleashStorageProvider from './ProtonUnleashStorageProvider';

// Just something dummy to have a valid domain because the library does new URL
const prefix = 'https://proton.me/';
const url = new URL(prefix);

export const createCustomFetch =
    (api: Api): typeof window.fetch =>
    (url, config) => {
        if (typeof url === 'string') {
            return api({
                url: `feature/v2/frontend${url.replace(prefix, '')}`,
                headers: config?.headers,
                silence: true,
                output: 'raw',
            });
        }
        throw new Error('not supported');
    };

interface Props {
    children: ReactNode;
}

const storageProvider = new ProtonUnleashStorageProvider();

export const getUnleashConfig = ({ fetch }: Pick<IConfig, 'fetch'>): IConfig => {
    return {
        url,
        clientKey: '-', // set by the server
        appName: '-', // set by the server
        refreshInterval: 600, // refreshInterval in seconds, 10 mins
        disableMetrics: true,
        fetch,
        storageProvider,
    };
};

type SimpleFunc = () => void;

export const createUnleashReadyPromise = (client: UnleashClient) => {
    let promise = createPromise<void>();
    const readyCallbackSet: Set<SimpleFunc> = new Set();
    const errorCallbackSet: Set<SimpleFunc> = new Set();

    // Memoize initial states to keep value consistency between hook instances
    let readyInitialState = false;

    const readyListener = () => {
        readyCallbackSet.forEach((callback) => callback());
    };
    const readyCallback: SimpleFunc = () => {
        if (readyInitialState === false) {
            promise.resolve();
            readyInitialState = true;
        }
    };
    const errorListener = () => {
        errorCallbackSet.forEach((callback) => callback());
    };

    if (readyCallbackSet.size === 0) {
        client.on('ready', readyListener);
        client.on('error', errorListener);
    }

    readyCallbackSet.add(readyCallback);
    errorCallbackSet.add(readyCallback);

    return {
        promise,
        unsubscribe: () => {
            readyCallbackSet.delete(readyCallback);
            errorCallbackSet.delete(readyCallback);
            if (readyCallbackSet.size === 0) {
                client.off('ready', readyListener);
                client.off('error', errorListener);
            }
        },
    };
};

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
export const useFlagsReady = () => {
    const client = useUnleashClient();
    const ref = useRef<ReturnType<typeof createUnleashReadyPromise> | null>(null);
    if (ref.current === null) {
        ref.current = createUnleashReadyPromise(client);
    }
    useEffect(() => {
        return () => {
            ref.current?.unsubscribe();
        };
    }, []);

    return ref.current?.promise!;
};

const UnleashFlagProvider = ({ children }: Props) => {
    const api = useApi();
    const unleashConfig: IConfig = getUnleashConfig({ fetch: createCustomFetch(api) });
    return <FlagProvider config={unleashConfig}>{children}</FlagProvider>;
};

export default UnleashFlagProvider;
