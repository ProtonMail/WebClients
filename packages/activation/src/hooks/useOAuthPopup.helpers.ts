import type { ApiEnvironmentConfig } from '@proton/shared/lib/interfaces';

import { ImportProvider, OAUTH_PROVIDER } from '../interface';
import { G_OAUTH_REDIRECT_PATH, O_OAUTH_REDIRECT_PATH } from '../path';

const generateGoogleOAuthUrl = (params: URLSearchParams, config: ApiEnvironmentConfig, loginHint?: string) => {
    params.append('access_type', 'offline');
    params.append('client_id', config['importer.google.client_id']);
    if (loginHint) {
        params.append('login_hint', loginHint);
    }
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

const generateOutlookOAuthUrl = (params: URLSearchParams, config: ApiEnvironmentConfig) => {
    params.append('client_id', config['importer.outlook.client_id']);
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
};

export const getOAuthRedirectURL = (provider: ImportProvider) => {
    const { protocol, host } = window.location;

    if (provider === ImportProvider.GOOGLE) {
        return `${protocol}//${host}${G_OAUTH_REDIRECT_PATH}`;
    }

    if (provider === ImportProvider.OUTLOOK) {
        return `${protocol}//${host}${O_OAUTH_REDIRECT_PATH}`;
    }

    throw new Error('Provider does not exist');
};

export const getOAuthAuthorizationUrl = ({
    provider,
    scope,
    config,
    loginHint,
    consentExperiment,
}: {
    provider: ImportProvider;
    scope: string;
    config: ApiEnvironmentConfig;
    loginHint?: string;
    consentExperiment: boolean;
}) => {
    const params = new URLSearchParams();

    params.append('redirect_uri', getOAuthRedirectURL(provider));
    params.append('response_type', 'code');
    params.append('scope', scope);

    if (provider === ImportProvider.GOOGLE) {
        // force user to consent again so that we can always get a refresh token
        params.append('prompt', 'consent');
        return generateGoogleOAuthUrl(params, config, loginHint);
    }

    if (provider === ImportProvider.OUTLOOK) {
        // The flag is present to control if we add the prompt params
        // The flag mustbe off to add the consent params
        if (!consentExperiment) {
            params.append('prompt', 'consent');
        }

        return generateOutlookOAuthUrl(params, config);
    }

    throw new Error('Provider does not exist');
};

export const getProviderNumber = (provider: ImportProvider) => {
    if ([ImportProvider.GOOGLE, ImportProvider.OUTLOOK].includes(provider)) {
        return provider === ImportProvider.GOOGLE ? OAUTH_PROVIDER.GOOGLE : OAUTH_PROVIDER.OUTLOOK;
    }

    throw new Error('Provider does not exist');
};
