import { GOOGLE_OAUTH_PATH } from '@proton/shared/lib/api/activation';
import { createUrl } from '@proton/shared/lib/fetch/helpers';
import type { ApiEnvironmentConfig } from '@proton/shared/lib/interfaces';

import { EASY_SWITCH_FEATURES, ImportProvider, ImportType, OAUTH_PROVIDER } from '../interface';
import { G_OAUTH_REDIRECT_PATH, O_OAUTH_REDIRECT_PATH, Z_OAUTH_REDIRECT_PATH } from '../path';

export const getEasySwitchFeaturesFromProducts = (importTypes: ImportType[]) => {
    const features: EASY_SWITCH_FEATURES[] = [];
    importTypes.forEach((importType) => {
        switch (importType) {
            case ImportType.MAIL:
                features.push(EASY_SWITCH_FEATURES.IMPORT_MAIL);
                break;
            case ImportType.CALENDAR:
                features.push(EASY_SWITCH_FEATURES.IMPORT_CALENDAR);
                break;
            case ImportType.CONTACTS:
                features.push(EASY_SWITCH_FEATURES.IMPORT_CONTACTS);
                break;
            default:
                break;
        }
    });

    return features;
};

export const generateGoogleOAuthUrl = ({
    redirectUri,
    loginHint,
    features,
}: {
    redirectUri: string;
    features: EASY_SWITCH_FEATURES[];
    loginHint?: string;
}) => {
    return createUrl(
        GOOGLE_OAUTH_PATH,
        {
            proton_feature: features,
            redirect_uri: redirectUri,
            loginHint: loginHint ? loginHint : undefined,
        },
        window.location.origin
    ).toString();
};

const generateOutlookOAuthUrl = (params: URLSearchParams, config: ApiEnvironmentConfig) => {
    params.append('client_id', config['oauth.outlook.client_id']);
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
};

const generateZoomOAuthUrl = (params: URLSearchParams, config: ApiEnvironmentConfig) => {
    params.append('client_id', config['oauth.zoom.client_id']);
    return `https://zoom.us/oauth/authorize?${params.toString()}`;
};

export const getOAuthRedirectURL = (provider: ImportProvider | OAUTH_PROVIDER) => {
    const { protocol, host } = window.location;

    if (provider === ImportProvider.GOOGLE || provider === OAUTH_PROVIDER.GOOGLE) {
        return `${protocol}//${host}${G_OAUTH_REDIRECT_PATH}`;
    }

    if (provider === ImportProvider.OUTLOOK || provider === OAUTH_PROVIDER.OUTLOOK) {
        return `${protocol}//${host}${O_OAUTH_REDIRECT_PATH}`;
    }

    if (provider === OAUTH_PROVIDER.ZOOM) {
        return `${protocol}//${host}${Z_OAUTH_REDIRECT_PATH}`;
    }

    throw new Error('Provider does not exist');
};

export const getOAuthAuthorizationUrl = ({
    provider,
    scope,
    config,
    consentExperiment,
}: {
    provider: ImportProvider | OAUTH_PROVIDER;
    scope: string;
    config: ApiEnvironmentConfig;
    consentExperiment: boolean;
}) => {
    const params = new URLSearchParams();

    params.append('redirect_uri', getOAuthRedirectURL(provider));
    params.append('response_type', 'code');
    params.append('scope', scope);

    if (provider === ImportProvider.OUTLOOK || provider === OAUTH_PROVIDER.OUTLOOK) {
        // The flag is present to control if we add the prompt params
        // The flag must be off to add the consent params
        if (!consentExperiment) {
            params.append('prompt', 'consent');
        }

        return generateOutlookOAuthUrl(params, config);
    }

    if (provider === OAUTH_PROVIDER.ZOOM) {
        return generateZoomOAuthUrl(params, config);
    }

    throw new Error('Provider does not exist');
};

export const getProviderNumber = (provider: ImportProvider | OAUTH_PROVIDER) => {
    switch (provider) {
        case ImportProvider.GOOGLE:
        case OAUTH_PROVIDER.GOOGLE:
            return OAUTH_PROVIDER.GOOGLE;
        case ImportProvider.OUTLOOK:
        case OAUTH_PROVIDER.OUTLOOK:
            return OAUTH_PROVIDER.OUTLOOK;
        case OAUTH_PROVIDER.ZOOM:
            return OAUTH_PROVIDER.ZOOM;
        default:
            throw new Error('Provider does not exist');
    }
};
