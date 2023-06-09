import type { AnyAction } from 'redux';

import type { ExtensionEndpoint, TabId } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object';

export type EndpointOptions = { endpoint?: ExtensionEndpoint; tabId?: TabId };
export type WithReceiverAction<T = AnyAction> = T & { meta: { receiver: EndpointOptions } };
export type WithSenderAction<T = AnyAction> = T & { meta: { sender?: EndpointOptions } };

/* type guard utility */
export const isActionWithReceiver = <T extends AnyAction>(action?: T): action is WithReceiverAction<T> => {
    const { meta } = action as any;
    return meta?.receiver !== undefined || meta?.tabId !== undefined;
};

export const acceptActionWithReceiver = (action: AnyAction, endpoint: ExtensionEndpoint, tabId?: TabId) => {
    if (isActionWithReceiver(action)) {
        const { meta } = action;
        return (
            (meta.receiver === undefined || meta.receiver.endpoint === endpoint) &&
            (meta.receiver.tabId === undefined || meta.receiver.tabId === tabId)
        );
    }

    return true;
};

export const withReceiver =
    (options: EndpointOptions) =>
    <T extends object>(action: T): WithReceiverAction<T> =>
        merge(action, { meta: { receiver: options } });

export const withSender =
    (options: EndpointOptions) =>
    <T extends object>(action: T): WithSenderAction<T> =>
        merge(action, { meta: { sender: options } });
