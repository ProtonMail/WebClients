import type { OAuthClientInfo } from '@proton/shared/lib/api/oauth';
import type { OAuthProduceForkParameters } from '@proton/shared/lib/authentication/fork/oauth';
import type { ProduceForkParametersFull } from '@proton/shared/lib/authentication/fork/produce';

import type { ProduceDesktopForkParameters } from './desktopForkInterface';

export enum SSOType {
    OAuth,
    Proton,
}

export type OAuthData = OAuthProduceForkParameters & {
    clientInfo: OAuthClientInfo;
};

export type ProtonForkData = {
    type: SSOType.Proton;
    payload: {
        forkParameters: ProduceForkParametersFull;
        desktopForkParameters?: ProduceDesktopForkParameters;
        searchParameters?: URLSearchParams;
    };
};

export type OAuthForkData = {
    type: SSOType.OAuth;
    payload: {
        oauthData: OAuthData;
    };
};

export type ProduceForkData = OAuthForkData | ProtonForkData;
