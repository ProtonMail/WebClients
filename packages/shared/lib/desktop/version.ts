import { electronAppVersion } from '../helpers/desktop';
import { getInboxDesktopInfo, hasInboxDesktopFeature, invokeInboxDesktopIPC } from './ipcHelpers';

export const addDesktopAppVersion = (appVersion: string) => {
    return `${electronAppVersion} (${appVersion})`;
};

export const storeVersionInboxElectron = (name: string, version: string) => {
    if (!hasInboxDesktopFeature('StoreVersion')) {
        return;
    }
    invokeInboxDesktopIPC({ type: 'storeAppVersion', payload: { name, version } });
};

export const getAllAppVersions = (): string => {
    if (!hasInboxDesktopFeature('StoreVersion')) {
        return electronAppVersion ?? '';
    }

    return getInboxDesktopInfo('getAllAppVersions');
};
