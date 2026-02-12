import { hasInboxDesktopFeature, invokeInboxDesktopIPC } from '../ipcHelpers';

function handleLogoutV2(logoutAllSession: boolean, userId: string) {
    if (!logoutAllSession) {
        return invokeInboxDesktopIPC({ type: 'userLogoutV2', payload: userId });
    }

    return invokeInboxDesktopIPC({ type: 'logoutAllUsers' });
}

export function invokeInboxDesktopLogout(logoutAllSession: boolean, userId: string) {
    if (hasInboxDesktopFeature('UserLogoutV2')) {
        return handleLogoutV2(logoutAllSession, userId);
    }

    return invokeInboxDesktopIPC({ type: 'userLogout' });
}
