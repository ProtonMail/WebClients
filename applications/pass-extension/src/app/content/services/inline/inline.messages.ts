import type { BridgeResponse } from 'proton-pass-extension/app/content/bridge/types';
import type { AutofillActionDTO } from 'proton-pass-extension/types/autofill';
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
import { isObject } from '@proton/pass/utils/object/is-object';

import type { DropdownActions } from './dropdown/dropdown.app';
import type { NotificationRequest } from './notification/notification.app';

/** These messages are not exported on the main
 * `WorkerMessages` as they are always forwarded
 * between the content-script and iframe. */
export enum InlinePortMessageType {
    AUTOFILL_ACTION = 'AUTOFILL_ACTION',
    AUTOFILL_EMAIL = 'AUTOFILL_EMAIL',
    AUTOFILL_FILTER = 'AUTOFILL_FILTER',
    AUTOFILL_GENERATED_PW = 'AUTOFILL_GENERATED_PASSWORD',
    AUTOFILL_IDENTITY = 'AUTOFILL_IDENTITY',
    AUTOFILL_LOGIN = 'AUTOFILL_LOGIN',
    AUTOFILL_OTP = 'AUTOFILL_OTP',
    DROPDOWN_ACTION = 'DROPDOWN_ACTION',
    DROPDOWN_FOCUS = 'DROPDOWN_FOCUS',
    DROPDOWN_FOCUSED = 'DROPDOWN_FOCUSED',
    DROPDOWN_BLURRED = 'DROPDOWN_BLURRED',
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

export type InlineCloseOptions = {
    /** User discarded the inline app */
    discard?: boolean;
    /** Flag indicitating we should refocus a field */
    refocus?: boolean;
    /** Wether close action was user-initiated */
    userAction?: boolean;
};

export type IFrameInitPayload = {
    domain: string;
    features: FeatureFlagState;
    settings: ProxiedSettings;
    appState: AppState;
    theme: PassThemeOption.PassDark | PassThemeOption.PassLight;
};

/** Supported Worker messages that are broadcasted
 * to iframe app ports that may affect iframe state. */
export type InlineWorkerMessages =
    | AutofillSyncMessage
    | FeatureFlagsUpdateMessage
    | LocaleUpdatedMessage
    | PortUnauthorizedMessage
    | SettingsUpdateMessage
    | WorkerStateChangeMessage;

export type InlineMessageType = InlinePortMessageType | InlineWorkerMessages['type'];

export type InlineMessage<T extends InlineMessageType = InlineMessageType> = Extract<
    | InlineWorkerMessages
    | { type: InlinePortMessageType.AUTOFILL_ACTION; payload: AutofillActionDTO }
    | { type: InlinePortMessageType.AUTOFILL_EMAIL; payload: { email: string } }
    | { type: InlinePortMessageType.AUTOFILL_FILTER; payload: { startsWith: string } }
    | { type: InlinePortMessageType.AUTOFILL_GENERATED_PW; payload: { password: string } }
    | { type: InlinePortMessageType.AUTOFILL_IDENTITY; payload: ItemContent<'identity'> }
    | { type: InlinePortMessageType.AUTOFILL_LOGIN; payload: FormCredentials }
    | { type: InlinePortMessageType.AUTOFILL_OTP; payload: { code: string } }
    | { type: InlinePortMessageType.DROPDOWN_ACTION; payload: DropdownActions }
    | { type: InlinePortMessageType.DROPDOWN_BLURRED }
    | { type: InlinePortMessageType.DROPDOWN_FOCUSED }
    | { type: InlinePortMessageType.DROPDOWN_FOCUS }
    | { type: InlinePortMessageType.DROPDOWN_FOCUS_REQUEST }
    | { type: InlinePortMessageType.IFRAME_CLOSE; payload: InlineCloseOptions }
    | { type: InlinePortMessageType.IFRAME_CONNECTED; payload: { framePort: string; id: IFrameEndpoint } }
    | { type: InlinePortMessageType.IFRAME_DIMENSIONS; payload: { height: number; width?: number } }
    | { type: InlinePortMessageType.IFRAME_HIDDEN }
    | { type: InlinePortMessageType.IFRAME_INIT; payload: IFrameInitPayload }
    | { type: InlinePortMessageType.IFRAME_INJECT_PORT; payload: { port: string } }
    | { type: InlinePortMessageType.IFRAME_OPEN }
    | { type: InlinePortMessageType.IFRAME_THEME; payload: PassThemeOption.PassLight | PassThemeOption.PassDark }
    | { type: InlinePortMessageType.NOTIFICATION_ACTION; payload: NotificationRequest }
    | { type: InlinePortMessageType.PASSKEY_RELAY; payload: PasskeyRelayedMessages },
    { type: T }
>;

export type InlineMessageWithSender<T extends InlineMessageType = InlineMessageType> = InlineMessage<T> & {
    frameId?: number;
    key?: string;
    sender: ClientEndpoint;
};

export type InlinePortMessageHandler<T extends InlineMessageType = InlineMessageType> = (
    message: InlineMessageWithSender<T>
) => void;

export const isInlineMessage = (message: unknown): message is InlineMessageWithSender =>
    isObject(message) && 'type' in message && typeof message.type === 'string';
