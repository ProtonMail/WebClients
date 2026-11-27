import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import { registerInboxDesktopAuthListener } from '@proton/shared/lib/desktop/registerInboxDesktopAuthListener';
import { registerInboxDesktopUrlRules } from '@proton/shared/lib/desktop/registerInboxDesktopUrlRules';
import { URL_RULES } from '@proton/shared/lib/desktop/urls/rules';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';

export function bootstrapAccountInboxDesktop(authentication: AuthenticationStore) {
    if (getIsIframe()) {
        return;
    }

    registerInboxDesktopAuthListener(authentication);
    registerInboxDesktopUrlRules(URL_RULES);
}
