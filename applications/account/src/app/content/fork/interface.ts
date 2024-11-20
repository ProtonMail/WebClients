import type { OAuthClientInfo } from '@proton/shared/lib/api/oauth';
import type { OAuthProduceForkParameters, ProduceForkParametersFull } from '@proton/shared/lib/authentication/fork';

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
