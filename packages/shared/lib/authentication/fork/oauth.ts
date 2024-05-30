import { OAuthForkResponse, postOAuthFork } from '../../api/oauth';
import { withUIDHeaders } from '../../fetch/headers';
import { replaceUrl } from '../../helpers/browser';
import { Api } from '../../interfaces';

export interface OAuthProduceForkParameters {
    clientID: string;
    oaSession: string;
}

interface ProduceOAuthForkArguments {
    api: Api;
    UID: string;
    oauthData: OAuthProduceForkParameters;
}

export const produceOAuthFork = async ({ api, UID, oauthData: { oaSession, clientID } }: ProduceOAuthForkArguments) => {
    const {
        Data: { RedirectUri },
    } = await api<{ Data: OAuthForkResponse }>(
        withUIDHeaders(
            UID,
            postOAuthFork({
                ClientID: clientID,
                OaSession: oaSession,
            })
        )
    );

    return replaceUrl(RedirectUri);
};
