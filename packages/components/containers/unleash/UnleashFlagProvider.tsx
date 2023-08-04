import { ReactElement } from 'react';

import FlagProvider from '@unleash/proxy-client-react';
import { IConfig } from 'unleash-proxy-client';

import { getClientID } from '@proton/shared/lib/apps/helper';
import { getAppVersionHeaders, getUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { ProtonConfig } from '@proton/shared/lib/interfaces';

interface Props {
    UID?: string;
    config: ProtonConfig;
    children: ReactElement;
}

const UnleashFlagProvider = ({ UID, config, children }: Props) => {
    const clientId = getClientID(config.APP_NAME);
    const authHeaders = UID ? getUIDHeaders(UID) : undefined;
    const appVersionHeaders = getAppVersionHeaders(clientId, config.APP_VERSION);
    const unleashConfig: IConfig = {
        url: `${window.location.origin}${config.API_URL}/feature/v2/frontend`,
        clientKey: '-', // set by the server
        appName: '-', // set by the server
        // refreshInterval in seconds
        refreshInterval: 600, // 10 mins
        customHeaders: {
            'Content-Type': 'application/json;charset=utf-8',
            accept: 'application/vnd.protonmail.v1+json',
            ...authHeaders,
            ...appVersionHeaders,
        },
        // Route feature/v2/frontend/client/metrics is not set by the server
        disableMetrics: true,
    };

    return <FlagProvider config={unleashConfig}>{children}</FlagProvider>;
};

export default UnleashFlagProvider;
