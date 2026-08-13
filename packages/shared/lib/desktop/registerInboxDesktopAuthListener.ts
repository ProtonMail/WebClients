import noop from '@proton/utils/noop';

import type { AuthenticationStore } from '../authentication/createAuthenticationStore';
import {
    addIPCHostUpdateListener,
    canListenInboxDesktopHostMessages,
    hasInboxDesktopFeature,
    invokeInboxDesktopIPC,
} from './ipcHelpers';

export function registerInboxDesktopAuthListener(authentication: AuthenticationStore) {
    if (!canListenInboxDesktopHostMessages || !hasInboxDesktopFeature('AuthStatusCheck')) {
        return;
    }

    addIPCHostUpdateListener('authStatusCheck', (payload) => {
        invokeInboxDesktopIPC({
            type: 'authStatusResult',
            payload: { hasAuth: authentication.hasSession(), uuid: payload },
        }).catch(noop);
    });
}
