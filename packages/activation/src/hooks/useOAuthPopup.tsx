import { openOAuthPopup } from '@proton/activation/src/helpers/oAuthPopup';
import {
    type EASY_SWITCH_FEATURES,
    ImportProvider,
    OAUTH_PROVIDER,
    type OAuthProps,
} from '@proton/activation/src/interface';
import useApiEnvironmentConfig from '@proton/components/hooks/useApiEnvironmentConfig';
import { useFlag } from '@proton/unleash';

import { generateGoogleOAuthUrl, getOAuthAuthorizationUrl, getOAuthRedirectURL } from './useOAuthPopup.helpers';

interface Props {
    errorMessage: string;
}

interface GoogleOAuth {
    provider: ImportProvider.GOOGLE | OAUTH_PROVIDER.GOOGLE;
    features: EASY_SWITCH_FEATURES[];
    loginHint?: string;
}

interface GenericOAuth {
    provider: Exclude<ImportProvider, ImportProvider.GOOGLE> | Exclude<OAUTH_PROVIDER, OAUTH_PROVIDER.GOOGLE>;
    scope: string;
}

type OAuthArgs = (GoogleOAuth | GenericOAuth) & {
    callback: (oauthProps: OAuthProps) => void | Promise<void>;
};

const useOAuthPopup = ({ errorMessage }: Props) => {
    const [config, loadingConfig] = useApiEnvironmentConfig();

    // We need to investigate Outlook b2b oAuth modal params
    const consentExperiment = useFlag('EasySwitchConsentExperiment');

    const triggerOAuthPopup = async (args: OAuthArgs) => {
        const { provider, callback } = args;
        let authorizationUrl;
        const redirectUri = getOAuthRedirectURL(provider);

        if (provider === ImportProvider.GOOGLE || provider === OAUTH_PROVIDER.GOOGLE) {
            const { loginHint, features } = args;
            authorizationUrl = generateGoogleOAuthUrl({ loginHint, features, redirectUri });
        } else {
            if (!config) {
                return;
            }
            const { scope } = args as GenericOAuth;

            authorizationUrl = getOAuthAuthorizationUrl({ provider, scope, config, consentExperiment });
        }

        void openOAuthPopup({ authorizationUrl, redirectUri, provider, callback, errorMessage });
    };

    return { triggerOAuthPopup, loadingConfig };
};

export default useOAuthPopup;
