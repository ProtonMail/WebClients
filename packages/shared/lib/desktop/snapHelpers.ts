import { getInboxDesktopInfo } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

export const getInboxDesktopIsSnapPackage = () => {
    if (!isElectronMail || !window.ipcInboxMessageBroker?.getInfo) {
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
