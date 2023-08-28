import { ReactNode } from 'react';

import FlagProvider from '@unleash/proxy-client-react';
import { IConfig } from 'unleash-proxy-client';

import { Api } from '@proton/shared/lib/interfaces';

import useApi from '../../hooks/useApi';

// Just something dummy to have a valid domain because the library does new URL
const prefix = 'https://proton.me/';
const url = new URL(prefix);

const customFetch =
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

const UnleashFlagProvider = ({ children }: Props) => {
    const api = useApi();
    const unleashConfig: IConfig = {
        url,
        clientKey: '-', // set by the server
        appName: '-', // set by the server
        refreshInterval: 600, // refreshInterval in seconds, 10 mins
        disableMetrics: true,
        fetch: customFetch(api),
    };

    return <FlagProvider config={unleashConfig}>{children}</FlagProvider>;
};

export default UnleashFlagProvider;
