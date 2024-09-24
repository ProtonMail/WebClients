import type { Runtime } from 'webextension-polyfill';

import type { FeatureFlagState } from '@proton/pass/store/reducers';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type {
    AppState,
    AutofillSyncMessage,
    ClientEndpoint,
    FeatureFlagsUpdateMessage,
    FormCredentials,
    ItemContent,
    LocaleUpdatedMessage,
    MaybeNull,
    PortUnauthorizedMessage,
    SettingsUpdateMessage,
    WorkerStateChangeMessage,
} from '@proton/pass/types';
import type { Rect } from '@proton/pass/types/utils/dom';

import type { DropdownActions } from './dropdown';
import type { NotificationActions } from './notification';

export type IFramePosition = Partial<Rect>;
export type IFrameEndpoint = 'notification' | 'dropdown';
export type IFrameCloseOptions = { discard?: boolean; event?: Event; refocus?: boolean };

export type IFrameInitPayload = {
    domain: string;
    features: FeatureFlagState;
    settings: ProxiedSettings;
    appState: AppState;
};

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
    sendMessage: (message: IFrameMessage) => void;
}

/** These messages are not exported on the main
 * `WorkerMessages` as they are always forwarded
 * between the content-script and iframe. */
export enum IFramePortMessageType {
    AUTOFILL_FILTER = 'AUTOFILL_FILTER',
    DROPDOWN_ACTION = 'DROPDOWN_ACTION',
    DROPDOWN_AUTOFILL_EMAIL = 'DROPDOWN_AUTOFILL_EMAIL',
    DROPDOWN_AUTOFILL_GENERATED_PW = 'DROPDOWN_AUTOFILL_GENERATED_PASSWORD',
    DROPDOWN_AUTOFILL_IDENTITY = 'DROPDOWN_AUTOFILL_IDENTITY',
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

/** Supported Worker messages that are broadcasted
 * to iframe app ports that may affect iframe state. */
export type IFrameWorkerMessages =
    | AutofillSyncMessage
    | FeatureFlagsUpdateMessage
    | LocaleUpdatedMessage
    | PortUnauthorizedMessage
    | SettingsUpdateMessage
    | WorkerStateChangeMessage;

export type IFrameMessageType = IFramePortMessageType | IFrameWorkerMessages['type'];

export type IFrameMessage<T extends IFrameMessageType = IFrameMessageType> = Extract<
    | IFrameWorkerMessages
    | { type: IFramePortMessageType.AUTOFILL_FILTER; payload: { startsWith: string } }
    | { type: IFramePortMessageType.DROPDOWN_ACTION; payload: DropdownActions }
    | { type: IFramePortMessageType.DROPDOWN_AUTOFILL_EMAIL; payload: { email: string } }
    | { type: IFramePortMessageType.DROPDOWN_AUTOFILL_GENERATED_PW; payload: { password: string } }
    | { type: IFramePortMessageType.DROPDOWN_AUTOFILL_IDENTITY; payload: ItemContent<'identity'> }
    | { type: IFramePortMessageType.DROPDOWN_AUTOFILL_LOGIN; payload: FormCredentials }
    | { type: IFramePortMessageType.IFRAME_CLOSE; payload: IFrameCloseOptions }
    | { type: IFramePortMessageType.IFRAME_CONNECTED; payload: { framePort: string; id: IFrameEndpoint } }
    | { type: IFramePortMessageType.IFRAME_DIMENSIONS; payload: { height: number; width?: number } }
    | { type: IFramePortMessageType.IFRAME_HIDDEN }
    | { type: IFramePortMessageType.IFRAME_INIT; payload: IFrameInitPayload }
    | { type: IFramePortMessageType.IFRAME_INJECT_PORT; payload: { port: string } }
    | { type: IFramePortMessageType.IFRAME_OPEN }
    | { type: IFramePortMessageType.NOTIFICATION_ACTION; payload: NotificationActions }
    | { type: IFramePortMessageType.NOTIFICATION_AUTOFILL_OTP; payload: { code: string } },
    { type: T }
>;

export type IFrameMessageWithSender<T extends IFrameMessageType = IFrameMessageType> = IFrameMessage<T> & {
    frameId?: number;
    key?: string;
    sender: ClientEndpoint;
};

export type IFramePortMessageHandler<T extends IFrameMessageType = IFrameMessageType> = (
    message: IFrameMessageWithSender<T>
) => void;
