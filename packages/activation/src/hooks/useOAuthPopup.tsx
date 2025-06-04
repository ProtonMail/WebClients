import { openOAuthPopup } from '@proton/activation/src/helpers/oAuthPopup';
import type { ImportProvider, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import useApiEnvironmentConfig from '@proton/components/hooks/useApiEnvironmentConfig';
import { useFlag } from '@proton/unleash';

import { getOAuthAuthorizationUrl, getOAuthRedirectURL } from './useOAuthPopup.helpers';

interface Props {
    errorMessage: string;
}

const useOAuthPopup = ({ errorMessage }: Props) => {
    const [config, loadingConfig] = useApiEnvironmentConfig();

    // We need to investigate Outlook b2b oAuth modal params
    const consentExperiment = useFlag('EasySwitchConsentExperiment');

    const triggerOAuthPopup = async ({
        provider,
        scope,
        loginHint,
        callback,
    }: {
        provider: ImportProvider | OAUTH_PROVIDER;
        scope: string;
        loginHint?: string;
        // TODO properly type this
        callback: (oauthProps: any) => void | Promise<void>;
    }) => {
        if (!config) {
            return;
        }
        const authorizationUrl = getOAuthAuthorizationUrl({ provider, scope, config, loginHint, consentExperiment });
        const redirectUri = getOAuthRedirectURL(provider);

        void openOAuthPopup({ authorizationUrl, redirectUri, provider, callback, errorMessage });
    };

    return { triggerOAuthPopup, loadingConfig };
};

export default useOAuthPopup;
