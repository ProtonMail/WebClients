import type { ProtocolSource } from './externalProtocols';
import { hasInboxDesktopFeature, invokeInboxDesktopIPC } from './ipcHelpers';

/**
 * registerInboxDesktopProtocols - Register given protocols for the given source
 * The source is either 'ipc' or 'redirect'. This gives extends the set of allowed protocols for the Inbox Desktop App.
 * They are called on bootstrap for Mail/Calendar but can be called anytime to extend the set of allowed protocols.
 * @param source {'ipc' | 'redirect'}
 * @param protocols {string[]} - The protocols to register
 * @returns {void}
 */
const registerInboxDesktopProtocols = (source: ProtocolSource, protocols: string[]) => {
    if (!hasInboxDesktopFeature('SetAllowedProtocols')) {
        return;
    }

    void invokeInboxDesktopIPC({
        type: 'setAllowedProtocols',
        payload: { protocols, source },
    });
};

/**
 * registerInboxDesktopIpcProtocols - Register given protocols for the 'ipc' source
 * Registers a list of protocols that are allowed to be opened in the browser without user confirmation. These
 * protocols are allowed for buttons/links that send out an 'openExternal' IPC message.
 * @param protocols {string[]} - The protocols to register
 */
export const registerInboxDesktopIpcProtocols = (protocols: string[]) => {
    registerInboxDesktopProtocols('ipc', protocols);
};

/**
 * registerInboxDesktopRedirectProtocols - Register given protocols for the 'redirect' source
 * Registers a list of protocols that are allowed to be opened in the browser without user confirmation. These
 * protocols are allowed for redirects, href links etc, mainly coming from content/navigation.
 * @param protocols {string[]} - The protocols to register
 */
export const registerInboxDesktopRedirectProtocols = (protocols: string[]) => {
    registerInboxDesktopProtocols('redirect', protocols);
};
