import type { BridgeResponse } from 'proton-pass-extension/app/content/bridge/types';
import type {
    AutofillSyncMessage,
    FeatureFlagsUpdateMessage,
    LocaleUpdatedMessage,
    PortUnauthorizedMessage,
    SettingsUpdateMessage,
    WorkerMessageType,
    WorkerStateChangeMessage,
} from 'proton-pass-extension/types/messages';

import type { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { AppState, ClientEndpoint, FormCredentials, ItemContent } from '@proton/pass/types';
import type { Rect } from '@proton/pass/types/utils/dom';

import type { DropdownActions } from './dropdown';
import type { NotificationRequest } from './notification';

/** These messages are not exported on the main
 * `WorkerMessages` as they are always forwarded
 * between the content-script and iframe. */
export enum IFramePortMessageType {
    AUTOFILL_EMAIL = 'AUTOFILL_EMAIL',
    AUTOFILL_FILTER = 'AUTOFILL_FILTER',
    AUTOFILL_GENERATED_PW = 'AUTOFILL_GENERATED_PASSWORD',
    AUTOFILL_IDENTITY = 'AUTOFILL_IDENTITY',
    AUTOFILL_LOGIN = 'AUTOFILL_LOGIN',
    AUTOFILL_OTP = 'AUTOFILL_OTP',
    DROPDOWN_ACTION = 'DROPDOWN_ACTION',
    DROPDOWN_FOCUS = 'DROPDOWN_FOCUS',
    DROPDOWN_FOCUSED = 'DROPDOWN_FOCUSED',
    DROPDOWN_FOCUS_REQUEST = 'DROPDOWN_FOCUS_REQUEST',
    IFRAME_CLOSE = 'IFRAME_CLOSE',
    IFRAME_CONNECTED = 'IFRAME_CONNECTED',
    IFRAME_DIMENSIONS = 'IFRAME_DIMENSIONS',
    IFRAME_HIDDEN = 'IFRAME_HIDDEN',
    IFRAME_INIT = 'IFRAME_INIT',
    IFRAME_INJECT_PORT = 'IFRAME_INJECT_PORT',
    IFRAME_OPEN = 'IFRAME_OPEN',
    IFRAME_THEME = 'IFRAME_THEME',
    NOTIFICATION_ACTION = 'NOTIFICATION_ACTION',
    PASSKEY_RELAY = 'PASSKEY_RELAY',
}

type PasskeyRelayedMessages =
    | BridgeResponse<WorkerMessageType.PASSKEY_CREATE>
    | BridgeResponse<WorkerMessageType.PASSKEY_GET>;

export type IFramePosition = Partial<Rect>;
export type IFrameEndpoint = 'notification' | 'dropdown';
export type IFrameCloseOptions = { discard?: boolean; refocus?: boolean };

export type IFrameInitPayload = {
    domain: string;
    features: FeatureFlagState;
    settings: ProxiedSettings;
    appState: AppState;
    theme: PassThemeOption.PassDark | PassThemeOption.PassLight;
};

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
    | { type: IFramePortMessageType.AUTOFILL_EMAIL; payload: { email: string } }
    | { type: IFramePortMessageType.AUTOFILL_FILTER; payload: { startsWith: string } }
    | { type: IFramePortMessageType.AUTOFILL_GENERATED_PW; payload: { password: string } }
    | { type: IFramePortMessageType.AUTOFILL_IDENTITY; payload: ItemContent<'identity'> }
    | { type: IFramePortMessageType.AUTOFILL_LOGIN; payload: FormCredentials }
    | { type: IFramePortMessageType.AUTOFILL_OTP; payload: { code: string } }
    | { type: IFramePortMessageType.DROPDOWN_ACTION; payload: DropdownActions }
    | { type: IFramePortMessageType.DROPDOWN_FOCUSED }
    | { type: IFramePortMessageType.DROPDOWN_FOCUS }
    | { type: IFramePortMessageType.DROPDOWN_FOCUS_REQUEST }
    | { type: IFramePortMessageType.IFRAME_CLOSE; payload: IFrameCloseOptions }
    | { type: IFramePortMessageType.IFRAME_CONNECTED; payload: { framePort: string; id: IFrameEndpoint } }
    | { type: IFramePortMessageType.IFRAME_DIMENSIONS; payload: { height: number; width?: number } }
    | { type: IFramePortMessageType.IFRAME_HIDDEN }
    | { type: IFramePortMessageType.IFRAME_INIT; payload: IFrameInitPayload }
    | { type: IFramePortMessageType.IFRAME_INJECT_PORT; payload: { port: string } }
    | { type: IFramePortMessageType.IFRAME_OPEN }
    | { type: IFramePortMessageType.IFRAME_THEME; payload: PassThemeOption.PassLight | PassThemeOption.PassDark }
    | { type: IFramePortMessageType.NOTIFICATION_ACTION; payload: NotificationRequest }
    | { type: IFramePortMessageType.PASSKEY_RELAY; payload: PasskeyRelayedMessages },
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
