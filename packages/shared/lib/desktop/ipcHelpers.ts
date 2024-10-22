import { isElectronMail } from '../helpers/desktop';
import type {
    IPCInboxClientUpdateMessage,
    IPCInboxDesktopFeature,
    IPCInboxGetInfoMessage,
    IPCInboxGetUserInfoMessage,
    IPCInboxHostUpdateListener,
    IPCInboxHostUpdateListenerRemover,
    IPCInboxHostUpdateMessageType,
    IPCInboxMessageBroker,
    PayloadOfHostUpdateType,
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

export const getInboxDesktopUserInfo = <T extends IPCInboxGetUserInfoMessage['type']>(key: T, userID: string) => {
    return window.ipcInboxMessageBroker!.getUserInfo!<T>(key, userID);
};

export const hasInboxDesktopFeature = (feature: IPCInboxDesktopFeature) =>
    isElectronMail &&
    !!window.ipcInboxMessageBroker &&
    !!window.ipcInboxMessageBroker!.hasFeature &&
    window.ipcInboxMessageBroker!.hasFeature(feature);

export function addIPCHostUpdateListener<T extends IPCInboxHostUpdateMessageType>(
    eventType: T,
    callback: (payload: PayloadOfHostUpdateType<T>) => void
): IPCInboxHostUpdateListenerRemover {
    // THIS NEEDS REFACTOR inda-refactor-001
    // This shouldn't be needed, better to avoid it with custom type-safe event emmiter
    //
    // With generic T we make sure first correct callback type is added to
    // correct event type. But the `on` function must accept union of callbacks.
    const unsafeCallback = callback as IPCInboxHostUpdateListener;
    return window.ipcInboxMessageBroker!.on!(eventType, unsafeCallback);
}
