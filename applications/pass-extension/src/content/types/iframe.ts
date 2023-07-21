import type { Runtime } from 'webextension-polyfill';

import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { MaybeNull, WorkerState } from '@proton/pass/types';
import type { Rect } from '@proton/pass/types/utils/dom';

import type { DropdownActions } from './dropdown';
import type { NotificationActions } from './notification';

export type IFramePosition = Partial<Rect> & { zIndex?: number };

export type IFrameState<A> = {
    visible: boolean;
    ready: boolean;
    loaded: boolean;
    port: MaybeNull<Runtime.Port>;
    framePort: MaybeNull<string>;
    position: IFramePosition;
    action: MaybeNull<A>;
};

export type IFramePortMessageHandler<T extends IFrameMessageType = IFrameMessageType> = (
    message: IFrameMessageWithSender<T>
) => void;

export type IFrameCloseOptions = { event?: Event; discard?: boolean; refocus?: boolean };

export interface IFrameApp<A = any> {
    element: HTMLIFrameElement;
    state: IFrameState<A>;
    sendPortMessage: (message: IFrameMessage) => void;
    registerMessageHandler: <M extends IFrameMessage['type']>(type: M, handler: IFramePortMessageHandler<M>) => void;
    getPosition: () => IFramePosition;
    updatePosition: () => void;
    open: (action: A, scrollRef?: HTMLElement) => void;
    close: (options?: IFrameCloseOptions) => void;
    init: (port: Runtime.Port) => void;
    reset: (workerState: WorkerState, settings: ProxiedSettings) => void;
    destroy: () => void;
}

export interface IFrameAppService<T extends { action: any }> {
    getState: () => IFrameState<T['action']>;
    open: (options: T) => IFrameAppService<T>;
    close: () => IFrameAppService<T>;
    init: (port: Runtime.Port) => IFrameAppService<T>;
    reset: (workerState: WorkerState, settings: ProxiedSettings) => IFrameAppService<T>;
    destroy: () => void;
}

export enum IFrameMessageType {
    IFRAME_INJECT_PORT = 'IFRAME_INJECT_PORT',
    IFRAME_CONNECTED = 'IFRAME_CONNECTED',
    IFRAME_INIT = 'IFRAME_INIT',
    IFRAME_OPEN = 'IFRAME_OPEN',
    IFRAME_CLOSE = 'IFRAME_CLOSE',
    IFRAME_HIDDEN = 'IFRAME_HIDDEN',
    IFRAME_DIMENSIONS = 'IFRAME_DIMENSIONS',
    DROPDOWN_ACTION = 'DROPDOWN_ACTION',
    DROPDOWN_AUTOFILL_LOGIN = 'DROPDOWN_AUTOFILL_LOGIN',
    DROPDOWN_AUTOFILL_GENERATED_PW = 'DROPDOWN_AUTOFILL_GENERATED_PASSWORD',
    DROPDOWN_AUTOFILL_EMAIL = 'DROPDOWN_AUTOFILL_EMAIL',
    NOTIFICATION_ACTION = 'NOTIFICATION_ACTION',
    NOTIFICATION_AUTOSAVE_REQUEST = 'NOTIFICATION_AUTOSAVE_REQUEST',
    NOTIFICATION_AUTOSAVE_SUCCESS = 'NOTIFICATION_AUTOSAVE_SUCCESS',
    NOTIFICATION_AUTOSAVE_FAILURE = 'NOTIFICATION_AUTOSAVE_FAILURE',
    NOTIFICATION_AUTOFILL_OTP = 'NOTIFICATION_AUTOFILL_OTP',
}

export type IFrameEndpoint = 'contentscript' | 'notification' | 'dropdown';

export type IFrameMessage<T extends IFrameMessageType = IFrameMessageType> = Extract<
    | { type: IFrameMessageType.IFRAME_INJECT_PORT; payload: { port: string } }
    | { type: IFrameMessageType.IFRAME_CONNECTED; payload: { framePort: string; id: IFrameEndpoint } }
    | { type: IFrameMessageType.IFRAME_INIT; payload: { workerState: WorkerState; settings: ProxiedSettings } }
    | { type: IFrameMessageType.IFRAME_OPEN }
    | { type: IFrameMessageType.IFRAME_CLOSE; payload: IFrameCloseOptions }
    | { type: IFrameMessageType.IFRAME_HIDDEN }
    | { type: IFrameMessageType.IFRAME_DIMENSIONS; payload: { height: number; width?: number } }
    | { type: IFrameMessageType.DROPDOWN_ACTION; payload: DropdownActions }
    | { type: IFrameMessageType.DROPDOWN_AUTOFILL_LOGIN; payload: { username: string; password: string } }
    | { type: IFrameMessageType.DROPDOWN_AUTOFILL_GENERATED_PW; payload: { password: string } }
    | { type: IFrameMessageType.DROPDOWN_AUTOFILL_EMAIL; payload: { email: string } }
    | { type: IFrameMessageType.NOTIFICATION_ACTION; payload: NotificationActions }
    | { type: IFrameMessageType.NOTIFICATION_AUTOFILL_OTP; payload: { code: string } },
    { type: T }
>;

export type IFrameMessageWithSender<T extends IFrameMessageType = IFrameMessageType> = {
    sender: IFrameEndpoint;
    frameId?: number;
} & IFrameMessage<T>;

export type IFrameSecureMessage<T extends IFrameMessageType = IFrameMessageType> = IFrameMessageWithSender<T> & {
    key: string;
};
