import { getAppHref } from '../apps/helper';
import { APPS } from '../constants';
import { getIsIframe } from '../helpers/browser';
import { isElectronMail } from '../helpers/desktop';
import type {
    IPCInboxClientGetAsyncDataMessage,
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

const IPC_POST_MESSAGE_NAME = 'InboxDesktopIPC' as const;

export function invokeInboxDesktopIPC({ type, payload }: IPCInboxClientUpdateMessage) {
    if (!isElectronMail) {
        return Promise.resolve();
    }

    if (window.ipcInboxMessageBroker?.send) {
        window.ipcInboxMessageBroker!.send!(type, payload);
    } else if (getIsIframe() && window.top) {
        const messageId = crypto.randomUUID();

        const messageReceptionPromise = new Promise<void>((resolve, reject) => {
            let timeoutErrorId: ReturnType<typeof setTimeout>;

            const handleMessage = (event: MessageEvent) => {
                if (event.data?.name === IPC_POST_MESSAGE_NAME && event.data?.id === messageId) {
                    clearTimeout(timeoutErrorId);
                    window.removeEventListener('message', handleMessage);
                    resolve();
                }
            };

            timeoutErrorId = setTimeout(() => {
                reject(new Error('IPC message was not received'));
                window.removeEventListener('message', handleMessage);
            }, 5000);

            window.addEventListener('message', handleMessage);
        });

        // With this targetOrigin resolution, we can only send IPC messages from frames
        // to the mail application. Currently this is ok because we only need this from
        // calendar drawer and mail previews, but might need improvement in the future.
        const targetURL = new URL(getAppHref('/', APPS.PROTONMAIL, undefined, location));

        window.top.postMessage(
            { name: IPC_POST_MESSAGE_NAME, id: messageId, type, payload },
            { targetOrigin: targetURL.origin }
        );

        return messageReceptionPromise;
    }

    return Promise.resolve();
}

export function handleInboxDesktopIPCPostMessages() {
    window.addEventListener('message', (event) => {
        if (event.data?.name === IPC_POST_MESSAGE_NAME) {
            event.source?.postMessage(
                { name: IPC_POST_MESSAGE_NAME, id: event.data.id },
                { targetOrigin: event.origin }
            );
            void invokeInboxDesktopIPC({ type: event.data.type, payload: event.data.payload });
        }
    });
}

export const canGetInboxDesktopInfo =
    isElectronMail && !!window.ipcInboxMessageBroker && !!window.ipcInboxMessageBroker!.getInfo;

export const canListenInboxDesktopHostMessages =
    isElectronMail && !!window.ipcInboxMessageBroker && !!window.ipcInboxMessageBroker!.on;

export const canGetAsyncInboxDesktopData =
    isElectronMail && !!window.ipcInboxMessageBroker && !!window.ipcInboxMessageBroker!.getAsyncData;

export function getInboxDesktopInfo<T extends IPCInboxGetInfoMessage['type']>(key: T) {
    return window.ipcInboxMessageBroker!.getInfo!<T>(key);
}

export const getInboxDesktopAsyncData = <T extends IPCInboxClientGetAsyncDataMessage['type']>(
    type: T,
    ...args: Extract<IPCInboxClientGetAsyncDataMessage, { type: T }>['args']
) => {
    return window.ipcInboxMessageBroker!.getAsyncData!<T>(type, ...args);
};

export const getInboxDesktopUserInfo = <T extends IPCInboxGetUserInfoMessage['type']>(key: T, userID: string) => {
    return window.ipcInboxMessageBroker!.getUserInfo!<T>(key, userID);
};

export const hasInboxDesktopFeature = (feature: IPCInboxDesktopFeature) =>
    isElectronMail &&
    !!window.ipcInboxMessageBroker &&
    !!window.ipcInboxMessageBroker!.hasFeature &&
    window.ipcInboxMessageBroker!.hasFeature(feature);

export const emptyListener: IPCInboxHostUpdateListenerRemover = { removeListener: () => {} };

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
