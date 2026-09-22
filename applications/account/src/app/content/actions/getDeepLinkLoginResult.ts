import type { APP_NAMES } from '@proton/shared/lib/constants';

import type { LoginLocationState } from './interface';

/**
 * When producing a fork and the redirect url is a deep link,
 * (deep link is used in desktop external login flow)
 * to avoid leaving the view on the password input, we reuse the
 * desktop auth result view which match exactly the need.
 */
export const getDeepLinkLoginResult = (
    app: APP_NAMES,
    redirectUrl: string,
    childClientId: string
): LoginLocationState => {
    return {
        type: 'auth-desktop',
        payload: {
            app,
            result: { type: 'success' },
            desktopForkParameters: {
                redirectUrl,
                app,
                // There's no qrcode in this version, using dummy data to validate
                qrCodePayload: {
                    version: 0,
                    userCode: 'fake',
                    encodedBytes: undefined,
                    childClientId,
                },
            },
        },
        location: '/auth-desktop',
    };
};
