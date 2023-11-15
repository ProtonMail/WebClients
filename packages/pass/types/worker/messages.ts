import type { AnyAction } from 'redux';
import type { Tabs } from 'webextension-polyfill';

import type { ExportRequestPayload } from '@proton/pass/lib/export/types';
import type { GeneratePasswordOptions } from '@proton/pass/lib/password/generator';
import type { Notification } from '@proton/pass/store/actions/with-notification';
import type { AliasOptions, FeatureFlagState } from '@proton/pass/store/reducers';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { CriteriaMasks } from '@proton/pass/types/worker/settings';
import type { ExtensionForkResultPayload } from '@proton/shared/lib/authentication/sessionForking';
import type { User } from '@proton/shared/lib/interfaces';

import type { ShareEventPayload } from '../api';
import type { ForkPayload } from '../api/fork';
import type { AliasCreationDTO, SelectedItem } from '../data';
import type { TelemetryEvent } from '../data/telemetry';
import type { Maybe, MaybeNull } from '../utils';
import type { AutofillResult } from './autofill';
import type { AutosavePayload, WithAutoSavePromptOptions } from './autosave';
import type { FormEntry, FormEntryPrompt, NewFormEntry } from './form';
import type { OnboardingMessage } from './onboarding';
import type { OtpCode, OtpRequest } from './otp';
import type { TabId } from './runtime';
import type { AppState, PopupInitialState } from './state';

type WithPayload<T extends WorkerMessageType, P extends {}> = { type: T; payload: P };
export type ExtensionEndpoint = 'popup' | 'contentscript' | 'background' | 'page' | 'notification' | 'dropdown';

export type WorkerMessageWithSender<T extends WorkerMessage = WorkerMessage> = T & {
    sender: ExtensionEndpoint;
    version: string;
};

export type PortFrameForwardingMessage<T = any> = {
    forwardTo: string;
    payload: T;
    type: WorkerMessageType.PORT_FORWARDING_MESSAGE;
};

export enum WorkerMessageType {
    ACCOUNT_EXTENSION = 'auth-ext',
    ACCOUNT_FORK = 'fork',
    ACCOUNT_ONBOARDING = 'pass-onboarding',
    ACCOUNT_PROBE = 'pass-installed',
    ACTIVITY_PROBE = 'ACTIVITY_PROBE',
    ALIAS_CREATE = 'ALIAS_CREATE',
    ALIAS_OPTIONS = 'ALIAS_OPTIONS',
    AUTOFILL_OTP_CHECK = 'AUTOFILL_OTP_CHECK',
    AUTOFILL_PASSWORD_OPTIONS = 'AUTOFILL_PASSWORD_OPTIONS',
    AUTOFILL_QUERY = 'AUTOFILL_QUERY',
    AUTOFILL_SELECT = 'AUTOFILL_SELECT',
    AUTOFILL_SYNC = 'AUTOFILL_SYNC',
    AUTOSAVE_REQUEST = 'AUTOSAVE_REQUEST',
    DEBUG = 'DEBUG',
    EXPORT_DECRYPT = 'EXPORT_DECRYPT',
    EXPORT_REQUEST = 'EXPORT_REQUEST',
    FEATURE_FLAGS_UPDATE = 'FEATURE_FLAGS_UPDATE',
    FORM_ENTRY_COMMIT = 'FORM_ENTRY_COMMIT',
    FORM_ENTRY_REQUEST = 'FORM_ENTRY_REQUEST',
    FORM_ENTRY_STAGE = 'FORM_ENTRY_STAGE',
    FORM_ENTRY_STASH = 'FORM_ENTRY_STASH',
    LOAD_CONTENT_SCRIPT = 'LOAD_CONTENT_SCRIPT',
    LOCALE_REQUEST = 'LOCALE_REQUEST',
    LOG_EVENT = 'LOG_EVENT',
    LOG_REQUEST = 'LOG_REQUEST',
    NOTIFICATION = 'NOTIFICATION',
    ONBOARDING_ACK = 'ONBOARDING_ACK',
    ONBOARDING_REQUEST = 'ONBOARDING_REQUEST',
    OTP_CODE_GENERATE = 'OTP_CODE_GENERATE',
    PAUSE_WEBSITE = 'PAUSE_WEBSITE',
    PERMISSIONS_UPDATE = 'PERMISSIONS_UPDATE',
    POPUP_INIT = 'POPUP_INIT',
    PORT_FORWARDING_MESSAGE = 'PORT_FORWARDING',
    PORT_UNAUTHORIZED = 'PORT_UNAUTHORIZED',
    RESOLVE_EXTENSION_KEY = 'RESOLVE_EXTENSION_KEY',
    RESOLVE_TAB = 'RESOLVE_TAB',
    RESOLVE_USER_DATA = 'RESOLVE_USER_DATA',
    SENTRY_CS_EVENT = 'SENTRY_CS_EVENT',
    SETTINGS_UPDATE = 'SETTINGS_UPDATE',
    SHARE_SERVER_EVENT = 'SHARE_SERVER_EVENT',
    START_CONTENT_SCRIPT = 'START_CONTENT_SCRIPT',
    STORE_ACTION = 'STORE_ACTION',
    TELEMETRY_EVENT = 'TELEMETRY_EVENT',
    UNLOAD_CONTENT_SCRIPT = 'UNLOAD_CONTENT_SCRIPT',
    UNLOCK_REQUEST = 'UNLOCK_REQUEST',
    UPDATE_AVAILABLE = 'UPDATE_AVAILABLE',
    WORKER_INIT = 'WORKER_INIT',
    WORKER_STATUS = 'WORKER_STATUS',
    WORKER_WAKEUP = 'WORKER_WAKEUP',
}

/* messages for communication with account */
export type AccountAuthExtMessage = { type: WorkerMessageType.ACCOUNT_EXTENSION };
export type AccountForkMessage = WithPayload<WorkerMessageType.ACCOUNT_FORK, ForkPayload>;
export type AccountPassOnboardingMessage = { type: WorkerMessageType.ACCOUNT_ONBOARDING };
export type AccountProbeMessage = { type: WorkerMessageType.ACCOUNT_PROBE };

export type ActivityProbeMessage = { type: WorkerMessageType.ACTIVITY_PROBE };
export type AliasCreateMessage = WithPayload<WorkerMessageType.ALIAS_CREATE, { url: string; alias: AliasCreationDTO }>;
export type AliasOptionsMessage = { type: WorkerMessageType.ALIAS_OPTIONS };
export type AutofillOTPCheckMessage = { type: WorkerMessageType.AUTOFILL_OTP_CHECK };
export type AutofillPasswordOptionsMessage = { type: WorkerMessageType.AUTOFILL_PASSWORD_OPTIONS };
export type AutofillQueryMessage = { type: WorkerMessageType.AUTOFILL_QUERY };
export type AutofillSelectMessage = WithPayload<WorkerMessageType.AUTOFILL_SELECT, SelectedItem>;
export type AutofillSyncMessage = WithPayload<WorkerMessageType.AUTOFILL_SYNC, AutofillResult>;
export type AutoSaveRequestMessage = WithPayload<WorkerMessageType.AUTOSAVE_REQUEST, AutosavePayload>;
export type DebugMessage = WithPayload<WorkerMessageType.DEBUG, { debug: string }>;
export type ExportRequestMessage = WithPayload<WorkerMessageType.EXPORT_REQUEST, ExportRequestPayload>;
export type FeatureFlagsUpdateMessage = WithPayload<WorkerMessageType.FEATURE_FLAGS_UPDATE, FeatureFlagState>;
export type FormEntryCommitMessage = WithPayload<WorkerMessageType.FORM_ENTRY_COMMIT, { reason: string }>;
export type FormEntryRequestMessage = { type: WorkerMessageType.FORM_ENTRY_REQUEST };
export type FormEntryStageMessage = WithPayload<WorkerMessageType.FORM_ENTRY_STAGE, NewFormEntry & { reason: string }>;
export type FormEntryStashMessage = WithPayload<WorkerMessageType.FORM_ENTRY_STASH, { reason: string }>;
export type ImportDecryptMessage = WithPayload<WorkerMessageType.EXPORT_DECRYPT, { data: string; passphrase: string }>;
export type LoadContentScriptMessage = { type: WorkerMessageType.LOAD_CONTENT_SCRIPT };
export type LocaleRequestMessage = { type: WorkerMessageType.LOCALE_REQUEST };
export type LogEventMessage = WithPayload<WorkerMessageType.LOG_EVENT, { log: string }>;
export type LogRequestMessage = { type: WorkerMessageType.LOG_REQUEST };
export type NotificationMessage = WithPayload<WorkerMessageType.NOTIFICATION, { notification: Notification }>;
export type OnboardingAckMessage = WithPayload<WorkerMessageType.ONBOARDING_ACK, { message: OnboardingMessage }>;
export type OnboardingRequestMessage = { type: WorkerMessageType.ONBOARDING_REQUEST };
export type OTPCodeGenerateMessage = WithPayload<WorkerMessageType.OTP_CODE_GENERATE, OtpRequest>;
export type PauseWebsiteMessage = WithPayload<
    WorkerMessageType.PAUSE_WEBSITE,
    { hostname: string; criteria: CriteriaMasks }
>;
export type PermissionsUpdateMessage = WithPayload<WorkerMessageType.PERMISSIONS_UPDATE, { check: boolean }>;
export type PopupInitMessage = WithPayload<WorkerMessageType.POPUP_INIT, { tabId: TabId }>;
export type PortUnauthorizedMessage = { type: WorkerMessageType.PORT_UNAUTHORIZED };
export type ResolveExtensionKeyMessage = { type: WorkerMessageType.RESOLVE_EXTENSION_KEY };
export type ResolveTabIdMessage = { type: WorkerMessageType.RESOLVE_TAB };
export type ResolveUserDataMessage = { type: WorkerMessageType.RESOLVE_USER_DATA };
export type SentryCSEventMessage = WithPayload<WorkerMessageType.SENTRY_CS_EVENT, { message: string; data: any }>;
export type SettingsUpdateMessage = WithPayload<WorkerMessageType.SETTINGS_UPDATE, ProxiedSettings>;
export type ShareServerEventMessage = WithPayload<WorkerMessageType.SHARE_SERVER_EVENT, ShareEventPayload>;
export type StartContentScriptMessage = { type: WorkerMessageType.START_CONTENT_SCRIPT };
export type StoreActionMessage = WithPayload<WorkerMessageType.STORE_ACTION, { action: AnyAction }>;
export type TelemetryEventMessage = WithPayload<WorkerMessageType.TELEMETRY_EVENT, { event: TelemetryEvent }>;
export type UnloadContentScriptMessage = { type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT };
export type UnlockRequestMessage = WithPayload<WorkerMessageType.UNLOCK_REQUEST, { pin: string }>;
export type UpdateAvailableMessage = { type: WorkerMessageType.UPDATE_AVAILABLE };
export type WorkerInitMessage = { type: WorkerMessageType.WORKER_INIT; payload?: { forceLock: boolean } };
export type WorkerStatusMessage = WithPayload<WorkerMessageType.WORKER_STATUS, { state: AppState }>;
export type WorkerWakeUpMessage = WithPayload<WorkerMessageType.WORKER_WAKEUP, { tabId: TabId }>;

export type WorkerMessage =
    | AccountAuthExtMessage
    | AccountForkMessage
    | AccountPassOnboardingMessage
    | AccountProbeMessage
    | ActivityProbeMessage
    | AliasCreateMessage
    | AliasOptionsMessage
    | AutofillOTPCheckMessage
    | AutofillPasswordOptionsMessage
    | AutofillQueryMessage
    | AutofillSelectMessage
    | AutofillSyncMessage
    | AutoSaveRequestMessage
    | DebugMessage
    | ExportRequestMessage
    | FeatureFlagsUpdateMessage
    | FormEntryCommitMessage
    | FormEntryRequestMessage
    | FormEntryStageMessage
    | FormEntryStashMessage
    | ImportDecryptMessage
    | LoadContentScriptMessage
    | LocaleRequestMessage
    | LogEventMessage
    | LogRequestMessage
    | NotificationMessage
    | OnboardingAckMessage
    | OnboardingRequestMessage
    | OTPCodeGenerateMessage
    | PauseWebsiteMessage
    | PermissionsUpdateMessage
    | PopupInitMessage
    | PortFrameForwardingMessage
    | PortUnauthorizedMessage
    | ResolveExtensionKeyMessage
    | ResolveTabIdMessage
    | ResolveUserDataMessage
    | SentryCSEventMessage
    | SettingsUpdateMessage
    | ShareServerEventMessage
    | StartContentScriptMessage
    | StoreActionMessage
    | TelemetryEventMessage
    | UnloadContentScriptMessage
    | UnlockRequestMessage
    | UpdateAvailableMessage
    | WorkerInitMessage
    | WorkerStatusMessage
    | WorkerWakeUpMessage;

export type MessageFailure = { type: 'error'; error: string; payload?: string };
export type MessageSuccess<T> = T extends { [key: string]: any } ? T & { type: 'success' } : { type: 'success' };
export type MaybeMessage<T> = MessageSuccess<T> | MessageFailure;
export type Outcome<T = {}, F = {}> = ({ ok: true } & T) | ({ ok: false; error: MaybeNull<string> } & F);

type WorkerMessageResponseMap = {
    [WorkerMessageType.ACCOUNT_FORK]: { payload: ExtensionForkResultPayload };
    [WorkerMessageType.ALIAS_CREATE]: Outcome;
    [WorkerMessageType.ALIAS_OPTIONS]: Outcome<{ options: AliasOptions; needsUpgrade: boolean }>;
    [WorkerMessageType.AUTOFILL_OTP_CHECK]: { shouldPrompt: false } | ({ shouldPrompt: true } & SelectedItem);
    [WorkerMessageType.AUTOFILL_PASSWORD_OPTIONS]: { options: GeneratePasswordOptions };
    [WorkerMessageType.AUTOFILL_QUERY]: AutofillResult;
    [WorkerMessageType.AUTOFILL_SELECT]: { username: string; password: string };
    [WorkerMessageType.EXPORT_DECRYPT]: { data: string };
    [WorkerMessageType.EXPORT_REQUEST]: { data: string };
    [WorkerMessageType.FORM_ENTRY_COMMIT]: { committed: Maybe<FormEntryPrompt> };
    [WorkerMessageType.FORM_ENTRY_REQUEST]: { submission: Maybe<WithAutoSavePromptOptions<FormEntry>> };
    [WorkerMessageType.FORM_ENTRY_STAGE]: { staged: FormEntry };
    [WorkerMessageType.LOCALE_REQUEST]: { locale: string };
    [WorkerMessageType.LOG_REQUEST]: { logs: string[] };
    [WorkerMessageType.ONBOARDING_REQUEST]: { message?: OnboardingMessage };
    [WorkerMessageType.OTP_CODE_GENERATE]: OtpCode;
    [WorkerMessageType.POPUP_INIT]: PopupInitialState;
    [WorkerMessageType.RESOLVE_EXTENSION_KEY]: { key: string };
    [WorkerMessageType.RESOLVE_TAB]: { tab: Maybe<Tabs.Tab> };
    [WorkerMessageType.RESOLVE_USER_DATA]: { user: MaybeNull<User> };
    [WorkerMessageType.UNLOCK_REQUEST]: Outcome<{}, { canRetry: boolean }>;
    [WorkerMessageType.WORKER_INIT]: AppState;
    [WorkerMessageType.WORKER_WAKEUP]: AppState & { settings: ProxiedSettings; features: FeatureFlagState };
};

export type WorkerMessageResponse<MessageType> = MessageType extends keyof WorkerMessageResponseMap
    ? WorkerMessageResponseMap[MessageType]
    : boolean;

export type WorkerResponse<T extends Maybe<WorkerMessage | WorkerMessageWithSender>> = T extends undefined
    ? MessageFailure
    : T extends WorkerMessage
    ? T['type'] extends infer MessageType
        ? MaybeMessage<WorkerMessageResponse<MessageType>>
        : never
    : never;

export type WorkerSendResponse<T extends Maybe<WorkerMessage> = Maybe<WorkerMessage>> = (
    response: WorkerResponse<T>
) => void;
