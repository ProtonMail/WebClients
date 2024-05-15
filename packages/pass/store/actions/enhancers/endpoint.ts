import type { Action } from 'redux';

import type { ClientEndpoint, TabId } from '@proton/pass/types';

import { type WithMeta, withMetaFactory } from './meta';

export type EndpointOptions = { endpoint?: ClientEndpoint; tabId?: TabId };
export type ReceiverMeta = { receiver: EndpointOptions };
export type SenderMeta = { sender?: EndpointOptions };
export type WithReceiverAction<A = Action> = WithMeta<ReceiverMeta, A>;
export type WithSenderAction<A = Action> = WithMeta<SenderMeta, A>;

export const withSender = (sender: EndpointOptions) => withMetaFactory<SenderMeta>({ sender });
export const withReceiver = (receiver: EndpointOptions) => withMetaFactory<ReceiverMeta>({ receiver });

export const isActionWithReceiver = <T extends Action>(action?: T): action is WithReceiverAction<T> => {
    const { meta } = action as any;
    return meta?.receiver !== undefined || meta?.tabId !== undefined;
};

export const isActionWithSender = <T extends Action>(action?: T): action is WithSenderAction<T> => {
    const { meta } = action as any;
    return meta?.sender !== undefined;
};

export const acceptActionWithReceiver = (action: Action, endpoint: ClientEndpoint, tabId?: TabId) => {
    if (isActionWithReceiver(action)) {
        const { meta } = action;
        return (
            (meta.receiver === undefined || meta.receiver.endpoint === endpoint) &&
            (meta.receiver.tabId === undefined || meta.receiver.tabId === tabId)
        );
    }

    return true;
};
