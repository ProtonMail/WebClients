import type { AnyAction } from 'redux';
import type { Tabs } from 'webextension-polyfill';

import type { ResumedSessionResult } from '@proton/pass/auth';
import type { ExportRequestPayload } from '@proton/pass/export/types';
import type { AliasState } from '@proton/pass/store';
import type { Notification } from '@proton/pass/store/actions/with-notification';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { ExtensionForkResultPayload } from '@proton/shared/lib/authentication/sessionForking';

import type { ShareEventPayload } from '../api';
import type { ForkPayload } from '../api/fork';
import type { AliasCreationDTO, SelectedItem } from '../data';
import type { TelemetryEvent } from '../data/telemetry';
import type { Maybe } from '../utils';
import type { AutosavePayload, WithAutoSavePromptOptions } from './autosave';
import type { SafeLoginItem } from './data';
import type { FormEntry, NewFormEntry, PromptedFormEntry } from './form';
import type { OnboardingMessage } from './onboarding';
import type { OtpCode, OtpRequest } from './otp';
import type { TabId } from './runtime';
import type { PopupState, WorkerState } from './state';

type WithPayload<T extends WorkerMessageType, P extends {}> = { type: T; payload: P };

export type PortFrameForwardingMessage<T = any> = {
    type: WorkerMessageType.PORT_FORWARDING_MESSAGE;
    forwardTo: string;
    payload: T;
};

export type ExtensionEndpoint = 'popup' | 'content-script' | 'background' | 'page';

export enum WorkerMessageType {
    ACCOUNT_FORK = 'fork',
    ACCOUNT_EXTENSION = 'auth-ext',
    ACCOUNT_PROBE = 'pass-installed',
    ACCOUNT_ONBOARDING = 'pass-onboarding',
    SESSION_RESUMED = 'SESSION_RESUMED',
    WORKER_WAKEUP = 'WORKER_WAKEUP',
    WORKER_INIT = 'WORKER_INIT',
    WORKER_STATUS = 'WORKER_STATUS',
    UPDATE_AVAILABLE = 'UPDATE_AVAILABLE',
    LOAD_CONTENT_SCRIPT = 'LOAD_CONTENT_SCRIPT',
    UNLOAD_CONTENT_SCRIPT = 'UNLOAD_CONTENT_SCRIPT',
    START_CONTENT_SCRIPT = 'START_CONTENT_SCRIPT',
    RESOLVE_EXTENSION_KEY = 'RESOLVE_EXTENSION_KEY',
    RESOLVE_TAB = 'RESOLVE_TAB',
    PORT_FORWARDING_MESSAGE = 'PORT_FORWARDING',
    PORT_UNAUTHORIZED = 'PORT_UNAUTHORIZED',
    NOTIFICATION = 'NOTIFICATION',
    STORE_ACTION = 'STORE_ACTION',
    AUTOFILL_QUERY = 'AUTOFILL_QUERY',
    AUTOFILL_SELECT = 'AUTOFILL_SELECT',
    AUTOFILL_SYNC = 'AUTOFILL_SYNC',
    AUTOSAVE_REQUEST = 'AUTOSAVE_REQUEST',
    ALIAS_OPTIONS = 'ALIAS_OPTIONS',
    ALIAS_CREATE = 'ALIAS_CREATE',
    OTP_CODE_GENERATE = 'OTP_CODE_GENERATE',
    FORM_ENTRY_STAGE = 'FORM_ENTRY_STAGE',
    FORM_ENTRY_STASH = 'FORM_ENTRY_STASH',
    FORM_ENTRY_COMMIT = 'FORM_ENTRY_COMMIT',
    FORM_ENTRY_REQUEST = 'FORM_ENTRY_REQUEST',
    EXPORT_REQUEST = 'EXPORT_REQUEST',
    EXPORT_DECRYPT = 'EXPORT_DECRYPT',
    SHARE_SERVER_EVENT = 'SHARE_SERVER_EVENT',
    ONBOARDING_REQUEST = 'ONBOARDING_REQUEST',
    ONBOARDING_ACK = 'ONBOARDING_ACK',
    TELEMETRY_EVENT = 'TELEMETRY_EVENT',
    LOG_EVENT = 'LOG_EVENT',
    LOG_REQUEST = 'LOG_REQUEST',
    SETTINGS_UPDATE = 'SETTINGS_UPDATE',
    PERMISSIONS_UPDATE = 'PERMISSIONS_UPDATE',
    IMPORT_PROGRESS = 'IMPORT_PROGRESS',
}

/* messages for communication with account */
export type AccountForkMessage = WithPayload<WorkerMessageType.ACCOUNT_FORK, ForkPayload>;
export type AccountAuthExtMessage = { type: WorkerMessageType.ACCOUNT_EXTENSION };
export type AccountProbeMessage = { type: WorkerMessageType.ACCOUNT_PROBE };
export type AccountPassOnboardingMessage = { type: WorkerMessageType.ACCOUNT_ONBOARDING };

export type WorkerWakeUpMessage = WithPayload<WorkerMessageType.WORKER_WAKEUP, { tabId: TabId }>;
export type WorkerInitMessage = WithPayload<WorkerMessageType.WORKER_INIT, { sync: boolean }>;
export type WorkerStatusMessage = WithPayload<WorkerMessageType.WORKER_STATUS, { state: WorkerState }>;
export type UpdateAvailableMessage = { type: WorkerMessageType.UPDATE_AVAILABLE };
export type UnloadContentScriptMessage = { type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT };
export type LoadContentScriptMessage = { type: WorkerMessageType.LOAD_CONTENT_SCRIPT };
export type StartContentScriptMessage = { type: WorkerMessageType.START_CONTENT_SCRIPT };
export type StoreActionMessage = WithPayload<WorkerMessageType.STORE_ACTION, { action: AnyAction }>;
export type ResumeSessionSuccessMessage = WithPayload<WorkerMessageType.SESSION_RESUMED, ResumedSessionResult>;
export type NotificationMessage = WithPayload<WorkerMessageType.NOTIFICATION, { notification: Notification }>;
export type AutofillQueryMessage = { type: WorkerMessageType.AUTOFILL_QUERY };
export type AutofillSyncMessage = WithPayload<WorkerMessageType.AUTOFILL_SYNC, { count: number }>;
export type AutofillSelectMessage = WithPayload<WorkerMessageType.AUTOFILL_SELECT, SelectedItem>;
export type AutoSaveRequestMessage = WithPayload<WorkerMessageType.AUTOSAVE_REQUEST, AutosavePayload>;
export type FormEntryStageMessage = WithPayload<WorkerMessageType.FORM_ENTRY_STAGE, NewFormEntry & { reason: string }>;
export type FormEntryStashMessage = WithPayload<WorkerMessageType.FORM_ENTRY_STASH, { reason: string }>;
export type FormEntryCommitMessage = WithPayload<WorkerMessageType.FORM_ENTRY_COMMIT, { reason: string }>;
export type FormEntryRequestMessage = { type: WorkerMessageType.FORM_ENTRY_REQUEST };
export type AliasOptionsMessage = { type: WorkerMessageType.ALIAS_OPTIONS };
export type AliasCreateMessage = WithPayload<WorkerMessageType.ALIAS_CREATE, { url: string; alias: AliasCreationDTO }>;
export type OTPCodeGenerateMessage = WithPayload<WorkerMessageType.OTP_CODE_GENERATE, OtpRequest>;
export type ResolveTabIdMessage = { type: WorkerMessageType.RESOLVE_TAB };
export type ResolveExtensionKeyMessage = { type: WorkerMessageType.RESOLVE_EXTENSION_KEY };
export type PortUnauthorizedMessage = { type: WorkerMessageType.PORT_UNAUTHORIZED };
export type ExportRequestMessage = WithPayload<WorkerMessageType.EXPORT_REQUEST, ExportRequestPayload>;
export type ImportDecryptMessage = WithPayload<WorkerMessageType.EXPORT_DECRYPT, { data: string; passphrase: string }>;
export type ShareServerEventMessage = WithPayload<WorkerMessageType.SHARE_SERVER_EVENT, ShareEventPayload>;
export type OnboardingRequestMessage = { type: WorkerMessageType.ONBOARDING_REQUEST };
export type OnboardingAckMessage = WithPayload<WorkerMessageType.ONBOARDING_ACK, { message: OnboardingMessage }>;
export type TelemetryEventMessage = WithPayload<WorkerMessageType.TELEMETRY_EVENT, { event: TelemetryEvent }>;
export type LogEventMessage = WithPayload<WorkerMessageType.LOG_EVENT, { log: string }>;
export type LogRequestMessage = { type: WorkerMessageType.LOG_REQUEST };
export type SettingsUpdateMessage = WithPayload<WorkerMessageType.SETTINGS_UPDATE, ProxiedSettings>;
export type PermissionsUpdateMessage = WithPayload<WorkerMessageType.PERMISSIONS_UPDATE, { check: boolean }>;
export type ImportProgressMessage = WithPayload<WorkerMessageType.IMPORT_PROGRESS, { progress: number }>;

export type WorkerMessage =
    | StoreActionMessage
    | NotificationMessage
    | AccountForkMessage
    | AccountAuthExtMessage
    | AccountProbeMessage
    | AccountPassOnboardingMessage
    | WorkerWakeUpMessage
    | WorkerInitMessage
    | WorkerStatusMessage
    | UpdateAvailableMessage
    | UnloadContentScriptMessage
    | StartContentScriptMessage
    | LoadContentScriptMessage
    | ResumeSessionSuccessMessage
    | AutofillQueryMessage
    | AutofillSelectMessage
    | AutofillSyncMessage
    | AutoSaveRequestMessage
    | OTPCodeGenerateMessage
    | FormEntryStageMessage
    | FormEntryStashMessage
    | FormEntryCommitMessage
    | FormEntryRequestMessage
    | AliasOptionsMessage
    | AliasCreateMessage
    | ResolveTabIdMessage
    | ResolveExtensionKeyMessage
    | ExportRequestMessage
    | ImportDecryptMessage
    | ShareServerEventMessage
    | PortFrameForwardingMessage
    | PortUnauthorizedMessage
    | OnboardingRequestMessage
    | OnboardingAckMessage
    | TelemetryEventMessage
    | LogEventMessage
    | LogRequestMessage
    | SettingsUpdateMessage
    | PermissionsUpdateMessage
    | ImportProgressMessage;

export type WorkerMessageWithSender<T extends WorkerMessage = WorkerMessage> = T & { sender: ExtensionEndpoint };
export type MessageFailure = { type: 'error'; error: string; payload?: string };
export type MessageSuccess<T> = T extends { [key: string]: any } ? T & { type: 'success' } : { type: 'success' };
export type MaybeMessage<T> = MessageSuccess<T> | MessageFailure;

export type WakeupResponse = WorkerState & {
    buffered?: WorkerMessageWithSender[];
    popup?: PopupState;
    settings?: ProxiedSettings;
};

type WorkerMessageResponseMap = {
    [WorkerMessageType.WORKER_WAKEUP]: WakeupResponse;
    [WorkerMessageType.WORKER_INIT]: WorkerState;
    [WorkerMessageType.RESOLVE_TAB]: { tab: Maybe<Tabs.Tab> };
    [WorkerMessageType.RESOLVE_EXTENSION_KEY]: { key: string };
    [WorkerMessageType.ACCOUNT_FORK]: { payload: ExtensionForkResultPayload };
    [WorkerMessageType.FORM_ENTRY_REQUEST]: { submission: Maybe<WithAutoSavePromptOptions<FormEntry>> };
    [WorkerMessageType.FORM_ENTRY_COMMIT]: { committed: Maybe<PromptedFormEntry> };
    [WorkerMessageType.FORM_ENTRY_STAGE]: { staged: FormEntry };
    [WorkerMessageType.AUTOFILL_QUERY]: { items: SafeLoginItem[]; needsUpgrade: boolean };
    [WorkerMessageType.AUTOFILL_SELECT]: { username: string; password: string };
    [WorkerMessageType.OTP_CODE_GENERATE]: OtpCode;
    [WorkerMessageType.ALIAS_OPTIONS]: { options: AliasState['aliasOptions']; needsUpgrade: boolean };
    [WorkerMessageType.EXPORT_REQUEST]: { data: string };
    [WorkerMessageType.EXPORT_DECRYPT]: { data: string };
    [WorkerMessageType.ONBOARDING_REQUEST]: { message?: OnboardingMessage };
    [WorkerMessageType.LOG_REQUEST]: { logs: string[] };
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
