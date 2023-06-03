import type { Runtime } from 'webextension-polyfill';

import type { MaybeNull, SafeLoginItem, WorkerState } from '@proton/pass/types';

import type { DropdownSetActionPayload } from './dropdown';
import type { NotificationSetActionPayload } from './notification';

export type IFramePosition = { top: number; left?: number; right?: number; zIndex?: number };
export type IFrameDimensions = { width: number; height: number };

export type IFrameState = {
    visible: boolean;
    ready: boolean;
    loaded: boolean;
    port: MaybeNull<Runtime.Port>;
    framePort: MaybeNull<string>;
    position: IFramePosition;
};

export type IFramePortMessageHandler<T extends IFrameMessageType = IFrameMessageType> = (
    message: IFrameMessageWithSender<T>
) => void;

export interface IFrameApp {
    element: HTMLIFrameElement;
    state: IFrameState;
    sendPortMessage: (message: IFrameMessage) => void;
    registerMessageHandler: <M extends IFrameMessage['type']>(type: M, handler: IFramePortMessageHandler<M>) => void;
    getPosition: () => IFramePosition;
    updatePosition: () => void;
    open: (scrollRef?: HTMLElement) => void;
    close: (options?: { event?: Event; userInitiated: boolean }) => void;
    init: (port: Runtime.Port) => void;
    reset: (workerState: WorkerState) => void;
    destroy: () => void;
}

export interface IFrameAppService<OpenOptions = {}> {
    getState: () => IFrameState;
    open: (options: OpenOptions) => IFrameAppService<OpenOptions>;
    close: () => IFrameAppService<OpenOptions>;
    init: (port: Runtime.Port) => IFrameAppService<OpenOptions>;
    reset: (workerState: WorkerState) => IFrameAppService<OpenOptions>;
    destroy: () => void;
}

export enum IFrameMessageType {
    IFRAME_INJECT_PORT = 'IFRAME_INJECT_PORT',
    IFRAME_CONNECTED = 'IFRAME_CONNECTED',
    IFRAME_INIT = 'IFRAME_INIT',
    IFRAME_OPEN = 'IFRAME_OPEN',
    IFRAME_CLOSE = 'IFRAME_CLOSE',
    IFRAME_DIMENSIONS = 'IFRAME_DIMENSIONS',
    DROPDOWN_ACTION = 'DROPDOWN_ACTION',
    DROPDOWN_AUTOFILL_LOGIN = 'DROPDOWN_AUTOFILL_LOGIN',
    DROPDOWN_AUTOSUGGEST_PASSWORD = 'DROPDOWN_AUTOSUGGEST_PASSWORD',
    DROPDOWN_AUTOSUGGEST_ALIAS = 'DROPDOWN_AUTOSUGGEST_ALIAS',
    NOTIFICATION_ACTION = 'NOTIFICATION_ACTION',
    NOTIFICATION_AUTOSAVE_REQUEST = 'NOTIFICATION_AUTOSAVE_REQUEST',
    NOTIFICATION_AUTOSAVE_SUCCESS = 'NOTIFICATION_AUTOSAVE_SUCCESS',
    NOTIFICATION_AUTOSAVE_FAILURE = 'NOTIFICATION_AUTOSAVE_FAILURE',
}

export type IFrameEndpoint = 'content-script' | 'notification' | 'dropdown';

export type IFrameMessage<T extends IFrameMessageType = IFrameMessageType> = Extract<
    | { type: IFrameMessageType.IFRAME_INJECT_PORT; payload: { port: string } }
    | { type: IFrameMessageType.IFRAME_CONNECTED; payload: { framePort: string; id: IFrameEndpoint } }
    | { type: IFrameMessageType.IFRAME_INIT; payload: { workerState: WorkerState } }
    | { type: IFrameMessageType.IFRAME_OPEN }
    | { type: IFrameMessageType.IFRAME_CLOSE }
    | { type: IFrameMessageType.IFRAME_DIMENSIONS; payload: { height: number; width?: number } }
    | { type: IFrameMessageType.DROPDOWN_ACTION; payload: DropdownSetActionPayload }
    | { type: IFrameMessageType.DROPDOWN_AUTOFILL_LOGIN; payload: { item: SafeLoginItem } }
    | { type: IFrameMessageType.DROPDOWN_AUTOSUGGEST_PASSWORD; payload: { password: string } }
    | { type: IFrameMessageType.DROPDOWN_AUTOSUGGEST_ALIAS; payload: { aliasEmail: string } }
    | { type: IFrameMessageType.NOTIFICATION_ACTION; payload: NotificationSetActionPayload },
    { type: T }
>;

export type IFrameMessageWithSender<T extends IFrameMessageType = IFrameMessageType> = {
    sender: IFrameEndpoint;
    frameId?: number;
} & IFrameMessage<T>;

export type IFrameSecureMessage<T extends IFrameMessageType = IFrameMessageType> = IFrameMessageWithSender<T> & {
    key: string;
};
