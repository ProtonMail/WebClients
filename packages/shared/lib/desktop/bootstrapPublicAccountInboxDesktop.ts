import type { AuthenticationStore } from '../authentication/createAuthenticationStore';
import { getIsIframe } from '../helpers/browser';
import { registerInboxDesktopAuthListener } from './registerInboxDesktopAuthListener';

export function bootstrapPublicAccountInboxDesktop(authentication: AuthenticationStore) {
    if (getIsIframe()) {
        return;
    }

    registerInboxDesktopAuthListener(authentication);
}
