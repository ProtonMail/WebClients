import { useApiEnvironmentConfig } from '@proton/mail/store/importerConfig/hooks';
import { GSUITE_OAUTH_PATH, MICROSOFT_BUSINESS_OAUTH_PATH } from '@proton/shared/lib/api/activation';
import { createUrl } from '@proton/shared/lib/fetch/helpers';
import { useFlag } from '@proton/unleash/useFlag';

import { openOAuthPopup } from '../helpers/oAuthPopup';
import { type EASY_SWITCH_FEATURES, ImportProvider, OAUTH_PROVIDER, type OAuthProps } from '../interface';
import {
    generateGoogleOAuthParams,
    generateGoogleOAuthUrl,
    getOAuthAuthorizationUrl,
    getOAuthRedirectURL,
} from './useOAuthPopup.helpers';

interface Props {
    errorMessage: string;
}

interface GoogleOAuth {
    provider: ImportProvider.GOOGLE | OAUTH_PROVIDER.GOOGLE;
    features: EASY_SWITCH_FEATURES[];
    loginHint?: string;
}

interface OlesOAuth {
    provider: OAUTH_PROVIDER.GSUITE | OAUTH_PROVIDER.MICROSOFT_BUSINESS;
    features: EASY_SWITCH_FEATURES[];
}

interface GenericOAuth {
    provider:
        | Exclude<ImportProvider, ImportProvider.GOOGLE>
        | Exclude<OAUTH_PROVIDER, OAUTH_PROVIDER.GOOGLE | OAUTH_PROVIDER.GSUITE | OAUTH_PROVIDER.MICROSOFT_BUSINESS>;
    scope: string;
}

type OAuthArgs = (OlesOAuth | GoogleOAuth | GenericOAuth) & {
    callback: (oauthProps: OAuthProps) => void | Promise<void>;
};

const useOAuthPopup = ({ errorMessage }: Props) => {
    const [config, loadingConfig] = useApiEnvironmentConfig();
    const selectAccountDisabled = useFlag('EasySwitchOutlookSelectAccountDisabled');

    const triggerOAuthPopup = async (args: OAuthArgs) => {
        const { provider, callback } = args;
        let authorizationUrl;
        const redirectUri = getOAuthRedirectURL(provider);

        switch (provider) {
            case ImportProvider.GOOGLE:
            case OAUTH_PROVIDER.GOOGLE: {
                const { loginHint, features } = args;
                authorizationUrl = generateGoogleOAuthUrl({ loginHint, features, redirectUri });
                break;
            }
            case OAUTH_PROVIDER.GSUITE: {
                const { features } = args;
                authorizationUrl = `${createUrl(
                    GSUITE_OAUTH_PATH,
                    generateGoogleOAuthParams({ features, redirectUri }),
                    window.location.origin
                )}`;
                break;
            }
            case OAUTH_PROVIDER.MICROSOFT_BUSINESS: {
                const { features } = args;
                authorizationUrl = `${createUrl(
                    MICROSOFT_BUSINESS_OAUTH_PATH,
                    generateGoogleOAuthParams({ features, redirectUri }),
                    window.location.origin
                )}`;
                break;
            }
            default: {
                if (!config) {
                    return;
                }
                const { scope } = args as GenericOAuth;

                authorizationUrl = getOAuthAuthorizationUrl({ provider, scope, config, selectAccountDisabled });
                break;
            }
        }

        void openOAuthPopup({ authorizationUrl, redirectUri, provider, callback, errorMessage });
    };

    return { triggerOAuthPopup, loadingConfig };
};

export default useOAuthPopup;
