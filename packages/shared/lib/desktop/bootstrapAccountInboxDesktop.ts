import type { AuthenticationStore } from '../authentication/createAuthenticationStore';
import { getIsIframe } from '../helpers/browser';
import { registerInboxDesktopAuthListener } from './registerInboxDesktopAuthListener';
import { registerInboxDesktopUrlRules } from './registerInboxDesktopUrlRules';
import { URL_RULES } from './urls/rules';

export function bootstrapAccountInboxDesktop(authentication: AuthenticationStore) {
    if (getIsIframe()) {
        return;
    }

    registerInboxDesktopAuthListener(authentication);
    registerInboxDesktopUrlRules(URL_RULES);
}
