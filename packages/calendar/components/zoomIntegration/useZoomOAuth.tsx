import { c } from 'ttag';

import { createToken } from '@proton/activation/src/api';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import type { OAuthProps } from '@proton/activation/src/interface';
import { EASY_SWITCH_SOURCES, ImportType, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { oauthTokenActions } from '@proton/activation/src/logic/oauthToken';
import { useApi } from '@proton/components';
import { useDispatch } from '@proton/redux-shared-store';

export const useZoomOAuth = () => {
    const api = useApi();
    const dispatch = useDispatch();

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('Error').t`Failed to load oauth modal.`,
    });

    const handleOAuthConnection = async (oAuthProps: OAuthProps) => {
        const { Code, Provider, RedirectUri } = oAuthProps;

        const tokens = await api(
            createToken({
                Provider,
                Code,
                RedirectUri,
                Source: EASY_SWITCH_SOURCES.CALENDAR_WEB_CREATE_EVENT,
                Products: [ImportType.CALENDAR],
            })
        );

        dispatch(oauthTokenActions.updateTokens(tokens.Tokens));
    };

    const triggerZoomOAuth = async (callback?: (oauthProps: OAuthProps) => void) => {
        triggerOAuthPopup({
            provider: OAUTH_PROVIDER.ZOOM,
            scope: '',
            callback: async (oauthProps) => {
                await handleOAuthConnection(oauthProps);
                callback?.(oauthProps);
            },
        });
    };

    return { loadingConfig, triggerZoomOAuth };
};
