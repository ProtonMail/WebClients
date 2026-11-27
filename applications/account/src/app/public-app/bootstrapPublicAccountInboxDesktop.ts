import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import { registerInboxDesktopAuthListener } from '@proton/shared/lib/desktop/registerInboxDesktopAuthListener';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';

export function bootstrapPublicAccountInboxDesktop(authentication: AuthenticationStore) {
    if (getIsIframe()) {
        return;
    }

    registerInboxDesktopAuthListener(authentication);
}
