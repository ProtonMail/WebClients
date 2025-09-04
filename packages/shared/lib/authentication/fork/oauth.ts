import type { OAuthForkResponse } from '../../api/oauth';
import { postOAuthFork } from '../../api/oauth';
import type { Api } from '../../interfaces';

export interface OAuthProduceForkParameters {
    clientID: string;
    oaSession: string;
}

interface ProduceOAuthForkArguments {
    api: Api;
    oauthData: OAuthProduceForkParameters;
}

export const produceOAuthFork = async ({ api, oauthData: { oaSession, clientID } }: ProduceOAuthForkArguments) => {
    const {
        Data: { RedirectUri },
    } = await api<{ Data: OAuthForkResponse }>(
        postOAuthFork({
            ClientID: clientID,
            OaSession: oaSession,
        })
    );
    return RedirectUri;
};
