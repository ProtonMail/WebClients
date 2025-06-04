import { getSignupAuthorizationURL } from '@proton/activation/src/helpers/signup';
import { EASY_SWITCH_FEATURES } from '@proton/activation/src/interface';
import { mockWindowLocation, resetWindowLocation } from '@proton/components/helpers/url.test.helpers';

const windowHostname = 'https://mail.proton.me';

describe('signup helpers', () => {
    describe('getSignupAuthorizationURL', () => {
        beforeEach(() => {
            mockWindowLocation(windowHostname);
        });

        afterEach(() => {
            resetWindowLocation();
        });

        it('should return the expected BYOE signup authorization URL', () => {
            const redirectUri = 'https://redirect-uri.com';
            const expectedAuthorizationURL = `https://mail.proton.me/api/oauth-token/v1/authorization/google?proton_feature=${EASY_SWITCH_FEATURES.BYOE}&redirect_uri=${encodeURIComponent(redirectUri)}`;

            expect(getSignupAuthorizationURL(redirectUri)).toEqual(expectedAuthorizationURL);
        });
    });
});
