import { hasInboxDesktopFeature, invokeInboxDesktopIPC } from './ipcHelpers';
import type { SerializedUrlRule } from './urls/builder';

/**
 * registerInboxDesktopUrlRules - Register the window-open redirect rules for a given source.
 *
 * The Inbox Desktop app decides what to do with a link opened in a new window (open in the
 * browser or load in a specific view) based on these rules. Each app declares its own rules and
 * registers them on bootstrap; rules are replaced per source, so a reloading view can safely
 * re-register without duplicating or dropping other apps' rules.
 *
 * @param rules {SerializedUrlRule[]} - The rules to register
 * @returns {void}
 */
export const registerInboxDesktopUrlRules = (rules: SerializedUrlRule[]) => {
    if (!hasInboxDesktopFeature('RegisterUrlRedirectRules')) {
        return;
    }

    void invokeInboxDesktopIPC({
        type: 'setUrlRedirectRules',
        payload: { rules },
    });
};
