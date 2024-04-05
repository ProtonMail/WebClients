import type { Runtime } from 'webextension-polyfill';

import type { FeatureFlagState } from '@proton/pass/store/reducers';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { AppState, FormCredentials, MaybeNull } from '@proton/pass/types';
import type { Rect } from '@proton/pass/types/utils/dom';

import type { DropdownActions } from './dropdown';
import type { NotificationActions } from './notification';

export type IFramePosition = Partial<Rect>;

export type IFrameState<A> = {
    action: MaybeNull<A>;
    framePort: MaybeNull<string>;
    loaded: boolean;
    port: MaybeNull<Runtime.Port>;
    position: IFramePosition;
    positionReq: number;
    ready: boolean;
    visible: boolean;
};

export type IFramePortMessageHandler<T extends IFrameMessageType = IFrameMessageType> = (
    message: IFrameMessageWithSender<T>
) => void;

export type IFrameCloseOptions = {
    discard?: boolean;
    event?: Event;
    refocus?: boolean;
};

export interface IFrameApp<A = any> {
    element: HTMLIFrameElement;
    state: IFrameState<A>;
    close: (options?: IFrameCloseOptions) => void;
    destroy: () => void;
    getPosition: () => IFramePosition;
    ensureLoaded: () => Promise<void>;
    ensureReady: () => Promise<void>;
    init: (port: Runtime.Port, payload: IFrameInitPayload) => void;
    open: (action: A, scrollRef?: HTMLElement) => void;
    registerMessageHandler: <M extends IFrameMessage['type']>(type: M, handler: IFramePortMessageHandler<M>) => void;
    sendPortMessage: (message: IFrameMessage) => void;
    updatePosition: () => void;
}

export interface IFrameAppService<T extends { action: any }> {
    close: () => IFrameAppService<T>;
    destroy: () => void;
    getState: () => IFrameState<T['action']>;
    init: (port: Runtime.Port, payload: IFrameInitPayload) => IFrameAppService<T>;
    open: (options: T) => IFrameAppService<T>;
}

export enum IFrameMessageType {
    DROPDOWN_ACTION = 'DROPDOWN_ACTION',
    DROPDOWN_AUTOFILL_EMAIL = 'DROPDOWN_AUTOFILL_EMAIL',
    DROPDOWN_AUTOFILL_GENERATED_PW = 'DROPDOWN_AUTOFILL_GENERATED_PASSWORD',
    DROPDOWN_AUTOFILL_LOGIN = 'DROPDOWN_AUTOFILL_LOGIN',
    IFRAME_CLOSE = 'IFRAME_CLOSE',
    IFRAME_CONNECTED = 'IFRAME_CONNECTED',
    IFRAME_DIMENSIONS = 'IFRAME_DIMENSIONS',
    IFRAME_HIDDEN = 'IFRAME_HIDDEN',
    IFRAME_INIT = 'IFRAME_INIT',
    IFRAME_INJECT_PORT = 'IFRAME_INJECT_PORT',
    IFRAME_OPEN = 'IFRAME_OPEN',
    NOTIFICATION_ACTION = 'NOTIFICATION_ACTION',
    NOTIFICATION_AUTOFILL_OTP = 'NOTIFICATION_AUTOFILL_OTP',
    NOTIFICATION_AUTOSAVE_FAILURE = 'NOTIFICATION_AUTOSAVE_FAILURE',
    NOTIFICATION_AUTOSAVE_REQUEST = 'NOTIFICATION_AUTOSAVE_REQUEST',
    NOTIFICATION_AUTOSAVE_SUCCESS = 'NOTIFICATION_AUTOSAVE_SUCCESS',
}

export type IFrameEndpoint = 'contentscript' | 'notification' | 'dropdown';
export type IFrameInitPayload = { workerState: AppState; settings: ProxiedSettings; features: FeatureFlagState };

export type IFrameMessage<T extends IFrameMessageType = IFrameMessageType> = Extract<
    | { type: IFrameMessageType.DROPDOWN_ACTION; payload: DropdownActions }
    | { type: IFrameMessageType.DROPDOWN_AUTOFILL_EMAIL; payload: { email: string } }
    | { type: IFrameMessageType.DROPDOWN_AUTOFILL_GENERATED_PW; payload: { password: string } }
    | { type: IFrameMessageType.DROPDOWN_AUTOFILL_LOGIN; payload: FormCredentials }
    | { type: IFrameMessageType.IFRAME_CLOSE; payload: IFrameCloseOptions }
    | { type: IFrameMessageType.IFRAME_CONNECTED; payload: { framePort: string; id: IFrameEndpoint } }
    | { type: IFrameMessageType.IFRAME_DIMENSIONS; payload: { height: number; width?: number } }
    | { type: IFrameMessageType.IFRAME_HIDDEN }
    | { type: IFrameMessageType.IFRAME_INIT; payload: IFrameInitPayload }
    | { type: IFrameMessageType.IFRAME_INJECT_PORT; payload: { port: string } }
    | { type: IFrameMessageType.IFRAME_OPEN }
    | { type: IFrameMessageType.NOTIFICATION_ACTION; payload: NotificationActions }
    | { type: IFrameMessageType.NOTIFICATION_AUTOFILL_OTP; payload: { code: string } },
    { type: T }
>;

export type IFrameMessageWithSender<T extends IFrameMessageType = IFrameMessageType> = {
    frameId?: number;
    sender: IFrameEndpoint;
} & IFrameMessage<T>;

export type IFrameSecureMessage<T extends IFrameMessageType = IFrameMessageType> = IFrameMessageWithSender<T> & {
    key: string;
};
