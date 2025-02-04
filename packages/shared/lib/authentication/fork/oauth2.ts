import type { ProduceForkParametersFull } from '@proton/shared/lib/authentication/fork/produce';
import type { Api } from '@proton/shared/lib/interfaces';

export interface OauthAuthorizeResponse {
    RedirectURL: string;
}

export const oauthAuthorizePartner = async ({
    api,
    forkParameters,
}: {
    api: Api;
    forkParameters: ProduceForkParametersFull;
}) => {
    if (!forkParameters.partnerId) {
        throw new Error('Fork parameters must be provided');
    }
    const { RedirectURL } = await api<OauthAuthorizeResponse>({
        method: 'get',
        url: `oauth/partners/${forkParameters.partnerId}/authorize`,
    });
    return RedirectURL;
};
