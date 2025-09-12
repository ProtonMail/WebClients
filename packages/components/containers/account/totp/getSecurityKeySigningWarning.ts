import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

export function getSecurityKeySigningWarning() {
    return c('Info')
        .t`Without an authenticator app, you will not be able to sign in to the ${BRAND_NAME} applications that don’t yet support security keys.`;
}
