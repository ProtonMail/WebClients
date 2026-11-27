import type { ProduceForkParametersFull } from '@proton/shared/lib/authentication/fork/produce';

import type { OAuthClientInfo } from '../../api/oauth';
import type { OAuthProduceForkParameters } from '../fork/oauth';
import type { ProduceDesktopForkParameters } from './desktopForkInterface';

export enum SSOType {
    OAuth = 0,
    Proton = 1,
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
