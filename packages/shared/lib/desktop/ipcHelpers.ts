import { isElectronApp } from '../helpers/desktop';
import { IPCInboxClientUpdateMessage, IPCInboxDesktopFeature, IPCInboxGetInfoMessage } from './desktopTypes';

export function invokeInboxDesktopIPC({ type, payload }: IPCInboxClientUpdateMessage) {
    if (isElectronApp && window.ipcInboxMessageBroker?.send) {
        window.ipcInboxMessageBroker!.send!(type, payload);
    }
}

export const canGetInboxDesktopInfo =
    isElectronApp && !!window.ipcInboxMessageBroker && !!window.ipcInboxMessageBroker!.getInfo;

export function getInboxDesktopInfo<T extends IPCInboxGetInfoMessage['type']>(key: T) {
    return window.ipcInboxMessageBroker!.getInfo!<T>(key);
}

export const hasInboxDesktopFeature = (feature: IPCInboxDesktopFeature) =>
    isElectronApp &&
    !!window.ipcInboxMessageBroker &&
    !!window.ipcInboxMessageBroker!.hasFeature &&
    window.ipcInboxMessageBroker!.hasFeature(feature);
