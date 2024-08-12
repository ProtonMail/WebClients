import { isElectronMail } from '../helpers/desktop';
import type {
    IPCInboxClientUpdateMessage,
    IPCInboxDesktopFeature,
    IPCInboxGetInfoMessage,
    IPCInboxMessageBroker,
} from './desktopTypes';

declare global {
    interface Window {
        ipcInboxMessageBroker?: IPCInboxMessageBroker;
    }
}

export function invokeInboxDesktopIPC({ type, payload }: IPCInboxClientUpdateMessage) {
    if (isElectronMail && window.ipcInboxMessageBroker?.send) {
        window.ipcInboxMessageBroker!.send!(type, payload);
    }
}

export const canGetInboxDesktopInfo =
    isElectronMail && !!window.ipcInboxMessageBroker && !!window.ipcInboxMessageBroker!.getInfo;

export const canListenInboxDesktopHostMessages =
    isElectronMail && !!window.ipcInboxMessageBroker && !!window.ipcInboxMessageBroker!.on;

export function getInboxDesktopInfo<T extends IPCInboxGetInfoMessage['type']>(key: T) {
    return window.ipcInboxMessageBroker!.getInfo!<T>(key);
}

export const hasInboxDesktopFeature = (feature: IPCInboxDesktopFeature) =>
    isElectronMail &&
    !!window.ipcInboxMessageBroker &&
    !!window.ipcInboxMessageBroker!.hasFeature &&
    window.ipcInboxMessageBroker!.hasFeature(feature);
