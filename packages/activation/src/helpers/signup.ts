import { EASY_SWITCH_FEATURES } from '@proton/activation/src/interface';
import { createUrl } from '@proton/shared/lib/fetch/helpers';

export const getSignupAuthorizationURL = (redirectUri: string) => {
    return createUrl(
        '/api/oauth-token/v1/authorization/google',
        {
            proton_feature: EASY_SWITCH_FEATURES.BYOE,
            redirect_uri: redirectUri,
        },
        window.location.origin
    ).toString();
};
