import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

export function getSecurityKeySigningWarning() {
    return c('Info')
        .t`Some ${BRAND_NAME} apps may not support security keys yet. If you turn off authenticator app 2FA, you may not be able to sign in to those apps.`;
}
