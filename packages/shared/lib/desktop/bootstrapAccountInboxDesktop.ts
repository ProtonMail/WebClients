import { getIsIframe } from '../helpers/browser';
import { registerInboxDesktopUrlRules } from './registerInboxDesktopUrlRules';
import { URL_RULES } from './urls/rules';

export function bootstrapAccountInboxDesktop() {
    if (getIsIframe()) {
        return;
    }

    registerInboxDesktopUrlRules(URL_RULES);
}
