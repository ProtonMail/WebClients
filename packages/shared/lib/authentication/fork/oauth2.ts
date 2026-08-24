import type { Api } from '../../interfaces';
import type { ProduceForkParametersFull } from './produce';

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
