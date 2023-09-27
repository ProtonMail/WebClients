import { ReactElement } from 'react';

import FlagProvider from '@unleash/proxy-client-react';
import { IConfig } from 'unleash-proxy-client';

import { ProtonConfig } from '@proton/shared/lib/interfaces';

import { useApi } from '../../hooks';

interface Props {
    UID?: string;
    config: ProtonConfig;
    children: ReactElement;
}

const UnleashFlagProvider = ({ config, children }: Props) => {
    const api = useApi();
    const unleashUrl = 'feature/v2/frontend';
    const unleashConfig: IConfig = {
        // URL needs to be valid for Unleash provider
        url: `${window.location.origin}${config.API_URL}/${unleashUrl}`,
        clientKey: '-', // set by the server
        appName: '-', // set by the server
        refreshInterval: 600, // refreshInterval in seconds, 10 mins,
        disableMetrics: true,
        /**
         * Here we use proton API to fetch the data (needed for the drawer)
         */
        fetch: (url: string, options: any) => api({ url: unleashUrl, ...options }),
    };

    return <FlagProvider config={unleashConfig}>{children}</FlagProvider>;
};

export default UnleashFlagProvider;
