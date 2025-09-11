import { c } from 'ttag';

export function getSecurityKeySigningWarning() {
    return c('Info')
        .t`Signing in with a security key is not yet supported in all applications. Without authenticator app 2FA, signing in to some applications may fail.`;
}
