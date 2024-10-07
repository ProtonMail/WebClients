import { isElectronMail } from '../helpers/desktop';
import type {
    IPCInboxClientUpdateMessage,
    IPCInboxDesktopFeature,
    IPCInboxGetInfoMessage,
    IPCInboxHostUpdateListener,
    IPCInboxHostUpdateListenerRemover,
    IPCInboxHostUpdateMessage,
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

export const hasInboxDesktopFeature = (feature: IPCInboxDesktopFeature) =>
    isElectronMail &&
    !!window.ipcInboxMessageBroker &&
    !!window.ipcInboxMessageBroker!.hasFeature &&
    window.ipcInboxMessageBroker!.hasFeature(feature);

// THIS NEEDS REFACTOR: inda-refactor-001
// Either avoid this function completelly or at least implemet it in zod.

export function isValidHostUpdateMessage(
    data: unknown
): { success: false; error: string } | { success: true; data: IPCInboxHostUpdateMessage } {
    if (!data) {
        return { success: false, error: 'is null' };
    }
    if (typeof data !== 'object') {
        return { success: false, error: 'not an object' };
    }

    if (!('type' in data)) {
        return { success: false, error: 'not have type' };
    }

    if (typeof data.type !== 'string') {
        return { success: false, error: 'have non-string type' };
    }

    if (!('payload' in data)) {
        return { success: false, error: 'not have payload' };
    }

    const allowedTypes = ['captureMessage', 'defaultMailtoChecked'];
    if (allowedTypes.indexOf(data.type) > -1) {
        return { success: true, data: data as IPCInboxHostUpdateMessage };
    }

    return { success: false, error: `unknown type ${data.type}` };
} // Assuming that broker was added as window object.

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
