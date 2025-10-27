import type { ReactNode } from 'react';

import { FlagProvider } from '@unleash/proxy-client-react';
import type { IConfig, UnleashClient } from 'unleash-proxy-client';

import { createPromise } from '@proton/shared/lib/helpers/promise';
import type { Api } from '@proton/shared/lib/interfaces';

import ProtonUnleashStorageProvider from './storage/UnleashStorageProvider';

// Just something dummy to have a valid domain because the library does new URL
const prefix = 'https://proton.me/';
const url = new URL(prefix);

export const createCustomFetch =
    (api: Api): typeof window.fetch =>
    (url, config) => {
        if (typeof url === 'string') {
            let body = undefined;
            const headers = config?.headers ? new Headers(config.headers) : undefined;
            if (
                config?.body &&
                typeof config.body === 'string' &&
                config.method === 'POST' &&
                headers?.get('Content-Type') === 'application/json'
            ) {
                try {
                    body = JSON.parse(config.body);
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error('Failed to parse Unleash metrics body', error);
                }
            }

            return api({
                url: `feature/v2/frontend${url.replace(prefix, '')}`,
                silence: true,
                output: 'raw',
                data: body,
                headers: config?.headers,
                method: config?.method,
                cache: config?.cache,
            });
        }

        throw new Error('not supported');
    };

const storageProvider = new ProtonUnleashStorageProvider();

export const getUnleashConfig = ({ fetch }: Pick<IConfig, 'fetch'>): IConfig => {
    return {
        url,
        clientKey: '-', // set by the server
        appName: '-', // set by the server
        refreshInterval: 600, // refreshInterval in seconds, 10 mins
        metricsIntervalInitial: 10, // Waits for 10 seconds before sending the first metrics
        metricsInterval: 600, // Sends the metrics every 10 minutes
        fetch,
        storageProvider,
    };
};

type SimpleFunc = () => void;

export const createUnleashReadyPromise = (client: UnleashClient) => {
    const promise = createPromise<void>();
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

interface Props {
    children: ReactNode;
    api: Api;
}

const UnleashFlagProvider = ({ children, api }: Props) => {
    const unleashConfig: IConfig = getUnleashConfig({ fetch: createCustomFetch(api) });
    return <FlagProvider config={unleashConfig}>{children}</FlagProvider>;
};

export default UnleashFlagProvider;
