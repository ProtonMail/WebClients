import {
    canListenInboxDesktopHostMessages,
    getInboxDesktopInfo,
    hasInboxDesktopFeature,
} from '@proton/shared/lib/desktop/ipcHelpers';

export const getInboxDesktopIsSnapPackage = () => {
    if (
        !canListenInboxDesktopHostMessages ||
        !window.ipcInboxMessageBroker?.getInfo ||
        !hasInboxDesktopFeature('SnapSupport')
    ) {
        return false;
    }

    return getInboxDesktopInfo('isSnap') ?? false;
};

export const getInboxDesktopSnapPackageRevision = () => {
    if (!getInboxDesktopIsSnapPackage()) {
        return '';
    }

    return getInboxDesktopInfo('snapRevision');
};
