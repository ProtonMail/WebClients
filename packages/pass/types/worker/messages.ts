import type { Action } from 'redux';

import type { UnlockDTO } from '@proton/pass/lib/auth/lock/types';
import type { AuthOptions } from '@proton/pass/lib/auth/service';
import type { PassCoreMethod, PassCoreRPC, PassCoreResult } from '@proton/pass/lib/core/types';
import type { ExportOptions } from '@proton/pass/lib/export/types';
import type { ImportReaderPayload } from '@proton/pass/lib/import/types';
import type {
    PasskeyCreatePayload,
    PasskeyCreateResponse,
    PasskeyGetPayload,
    PasskeyGetResponse,
    PasskeyQueryPayload,
    SelectedPasskey,
} from '@proton/pass/lib/passkeys/types';
import type { PasswordAutosuggestOptions } from '@proton/pass/lib/password/types';
import type { Notification } from '@proton/pass/store/actions/enhancers/notification';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { B2BEvent } from '@proton/pass/types/data/b2b';
import type { PauseListEntry } from '@proton/pass/types/worker/settings';
import type { TransferableFile } from '@proton/pass/utils/file/transferable-file';
import type { ExtensionForkResultPayload } from '@proton/shared/lib/authentication/fork/extension';
import type { User } from '@proton/shared/lib/interfaces';

import type { ForkPayload } from '../api/fork';
import type { AliasCreationDTO, AliasOptions, ItemContent, SelectedItem, UniqueItem } from '../data';
import type { TelemetryEvent } from '../data/telemetry';
import type { Maybe, MaybeNull } from '../utils';
import type { AutofillIdentityResult, AutofillLoginResult, AutofillOptions } from './autofill';
import type { AutosaveRequest } from './autosave';
import type { AutosaveFormEntry, FormCredentials, FormStatusPayload, FormSubmitPayload } from './form';
import type { OnboardingMessage } from './onboarding';
import type { OtpCode, OtpRequest } from './otp';
import type { ExclusionRules } from './rules';
import type { TabId, TabInfo } from './runtime';
import type { AppState, PopupInitialState } from './state';

export type WithPayload<T extends WorkerMessageType, P extends {}> = { type: T; payload: P };
export type ClientEndpoint =
    | 'popup'
    | 'contentscript'
    | 'background'
    | 'page'
    | 'notification'
    | 'dropdown'
    | 'web'
    | 'desktop';

export type WorkerMessageWithSender<T extends WorkerMessage = WorkerMessage> = T & {
    sender: ClientEndpoint;
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
    ALIAS_CREATE = 'ALIAS_CREATE',
    ALIAS_OPTIONS = 'ALIAS_OPTIONS',
    AUTH_CHECK = 'AUTH_CHECK',
    AUTH_CONFIRM_PASSWORD = 'AUTH_CONFIRM_PASSWORD',
    AUTH_INIT = 'AUTH_INIT',
    AUTH_UNLOCK = 'AUTH_UNLOCK',
    AUTOFILL_IDENTITY = 'AUTOFILL_IDENTITY',
    AUTOFILL_IDENTITY_QUERY = 'AUTOFILL_IDENTITY_QUERY',
    AUTOFILL_LOGIN = 'AUTOFILL_LOGIN',
    AUTOFILL_LOGIN_QUERY = 'AUTOFILL_LOGIN_QUERY',
    AUTOFILL_OTP_CHECK = 'AUTOFILL_OTP_CHECK',
    AUTOFILL_SYNC = 'AUTOFILL_SYNC',
    AUTOSAVE_REQUEST = 'AUTOSAVE_REQUEST',
    AUTOSUGGEST_PASSWORD = 'AUTOSUGGEST_PASSWORD',
    B2B_EVENT = 'B2B_EVENT',
    DEBUG = 'DEBUG',
    EXPORT_REQUEST = 'EXPORT_REQUEST',
    FEATURE_FLAGS_UPDATE = 'FEATURE_FLAGS_UPDATE',
    FETCH_ABORT = 'FETCH_ABORT',
    FETCH_DOMAINIMAGE = 'FETCH_DOMAINIMAGE',
    FORM_ENTRY_COMMIT = 'FORM_ENTRY_COMMIT',
    FORM_ENTRY_REQUEST = 'FORM_ENTRY_REQUEST',
    FORM_ENTRY_STAGE = 'FORM_ENTRY_STAGE',
    FORM_ENTRY_STASH = 'FORM_ENTRY_STASH',
    FORM_STATUS = 'FORM_STATUS',
    IMPORT_DECRYPT = 'IMPORT_DECRYPT',
    LOAD_CONTENT_SCRIPT = 'LOAD_CONTENT_SCRIPT',
    LOCALE_REQUEST = 'LOCALE_REQUEST',
    LOCALE_UPDATED = 'LOCALE_UPDATED',
    LOG_EVENT = 'LOG_EVENT',
    LOG_REQUEST = 'LOG_REQUEST',
    MONITOR_2FAS = 'MONITOR_2FAS',
    MONITOR_WEAK_PASSWORDS = 'MONITOR_WEAK_PASSWORDS',
    NOTIFICATION = 'NOTIFICATION',
    ONBOARDING_ACK = 'ONBOARDING_ACK',
    ONBOARDING_CHECK = 'ONBOARDING_CHECK',
    ONBOARDING_REQUEST = 'ONBOARDING_REQUEST',
    OTP_CODE_GENERATE = 'OTP_CODE_GENERATE',
    PASS_CORE_RPC = 'PASS_CORE_RPC',
    PASSKEY_CREATE = 'PASSKEY_CREATE',
    PASSKEY_GET = 'PASSKEY_GET',
    PASSKEY_INTERCEPT = 'PASSKEY_INTERCEPT',
    PASSKEY_QUERY = 'PASSKEY_QUERY',
    PAUSE_WEBSITE = 'PAUSE_WEBSITE',
    PERMISSIONS_UPDATE = 'PERMISSIONS_UPDATE',
    PING = 'PING',
    POPUP_INIT = 'POPUP_INIT',
    PORT_FORWARDING_MESSAGE = 'PORT_FORWARDING',
    PORT_UNAUTHORIZED = 'PORT_UNAUTHORIZED',
    REGISTER_ELEMENTS = 'REGISTER_ELEMENTS',
    RESOLVE_EXTENSION_KEY = 'RESOLVE_EXTENSION_KEY',
    RESOLVE_USER = 'RESOLVE_USER',
    SENTRY_CS_EVENT = 'SENTRY_CS_EVENT',
    SETTINGS_UPDATE = 'SETTINGS_UPDATE',
    START_CONTENT_SCRIPT = 'START_CONTENT_SCRIPT',
    STORE_DISPATCH = 'STORE_DISPATCH',
    TABS_QUERY = 'TABS_QUERY',
    TELEMETRY_EVENT = 'TELEMETRY_EVENT',
    UNLOAD_CONTENT_SCRIPT = 'UNLOAD_CONTENT_SCRIPT',
    UPDATE_AVAILABLE = 'UPDATE_AVAILABLE',
    WEBSITE_RULES_REQUEST = 'WEBSITE_RULES_REQUEST',
    WORKER_RELOAD = 'WORKER_RELOAD',
    WORKER_STATE_CHANGE = 'WORKER_STATE_CHANGE',
    WORKER_WAKEUP = 'WORKER_WAKEUP',
}

/* messages for communication with account */
export type AccountAuthExtMessage = { type: WorkerMessageType.ACCOUNT_EXTENSION };
export type AccountForkMessage = WithPayload<WorkerMessageType.ACCOUNT_FORK, ForkPayload>;
export type AccountPassOnboardingMessage = { type: WorkerMessageType.ACCOUNT_ONBOARDING };
export type AccountProbeMessage = { type: WorkerMessageType.ACCOUNT_PROBE };
export type AliasCreateMessage = WithPayload<WorkerMessageType.ALIAS_CREATE, { url: string; alias: AliasCreationDTO }>;
export type AliasOptionsMessage = { type: WorkerMessageType.ALIAS_OPTIONS };
export type AuthCheckMessage = WithPayload<WorkerMessageType.AUTH_CHECK, { immediate?: boolean }>;
export type AuthConfirmPasswordMessage = WithPayload<WorkerMessageType.AUTH_CONFIRM_PASSWORD, { password: string }>;
export type AuthInitMessage = { type: WorkerMessageType.AUTH_INIT; options: AuthOptions };
export type AuthUnlockMessage = WithPayload<WorkerMessageType.AUTH_UNLOCK, UnlockDTO>;
export type AutofillIdentityMessage = WithPayload<WorkerMessageType.AUTOFILL_IDENTITY, SelectedItem>;
export type AutofillIdentityQueryMessage = { type: WorkerMessageType.AUTOFILL_IDENTITY_QUERY };
export type AutofillLoginMessage = WithPayload<WorkerMessageType.AUTOFILL_LOGIN, SelectedItem>;
export type AutofillLoginQueryMessage = WithPayload<WorkerMessageType.AUTOFILL_LOGIN_QUERY, AutofillOptions>;
export type AutofillOTPCheckMessage = { type: WorkerMessageType.AUTOFILL_OTP_CHECK };
export type AutofillPasswordOptionsMessage = { type: WorkerMessageType.AUTOSUGGEST_PASSWORD };
export type AutofillSyncMessage = { type: WorkerMessageType.AUTOFILL_SYNC };
export type AutoSaveRequestMessage = WithPayload<WorkerMessageType.AUTOSAVE_REQUEST, AutosaveRequest>;
export type B2BEventMessage = WithPayload<WorkerMessageType.B2B_EVENT, { event: B2BEvent }>;
export type DebugMessage = WithPayload<WorkerMessageType.DEBUG, { debug: string }>;
export type ExportRequestMessage = WithPayload<WorkerMessageType.EXPORT_REQUEST, ExportOptions>;
export type FeatureFlagsUpdateMessage = WithPayload<WorkerMessageType.FEATURE_FLAGS_UPDATE, FeatureFlagState>;
export type FetchAbortMessage = WithPayload<WorkerMessageType.FETCH_ABORT, { requestId: string }>;
export type FetchDomainImageMessage = WithPayload<WorkerMessageType.FETCH_DOMAINIMAGE, { url: string }>;
export type FormEntryCommitMessage = WithPayload<WorkerMessageType.FORM_ENTRY_COMMIT, { reason: string }>;
export type FormEntryRequestMessage = { type: WorkerMessageType.FORM_ENTRY_REQUEST };
export type FormEntryStageMessage = WithPayload<WorkerMessageType.FORM_ENTRY_STAGE, FormSubmitPayload>;
export type FormEntryStashMessage = WithPayload<WorkerMessageType.FORM_ENTRY_STASH, { reason: string }>;
export type FormStatusMessage = WithPayload<WorkerMessageType.FORM_STATUS, FormStatusPayload>;
export type ImportDecryptMessage = WithPayload<WorkerMessageType.IMPORT_DECRYPT, ImportReaderPayload>;
export type LoadContentScriptMessage = { type: WorkerMessageType.LOAD_CONTENT_SCRIPT };
export type LocaleRequestMessage = { type: WorkerMessageType.LOCALE_REQUEST };
export type LocaleUpdatedMessage = WithPayload<WorkerMessageType.LOCALE_UPDATED, { locale: string }>;
export type LogEventMessage = WithPayload<WorkerMessageType.LOG_EVENT, { log: string }>;
export type LogRequestMessage = { type: WorkerMessageType.LOG_REQUEST };
export type Monitor2FAsMessage = { type: WorkerMessageType.MONITOR_2FAS };
export type MonitorWeakPasswordsMessage = { type: WorkerMessageType.MONITOR_WEAK_PASSWORDS };
export type NotificationMessage = WithPayload<WorkerMessageType.NOTIFICATION, { notification: Notification }>;
export type OnboardingAckMessage = WithPayload<WorkerMessageType.ONBOARDING_ACK, { message: OnboardingMessage }>;
export type OnboardingCheckMessage = WithPayload<WorkerMessageType.ONBOARDING_CHECK, { message: OnboardingMessage }>;
export type OnboardingRequestMessage = { type: WorkerMessageType.ONBOARDING_REQUEST };
export type OTPCodeGenerateMessage = WithPayload<WorkerMessageType.OTP_CODE_GENERATE, OtpRequest>;
export type PassCoreRPCMessage = WithPayload<WorkerMessageType.PASS_CORE_RPC, PassCoreRPC<PassCoreMethod>>;
export type PasskeyCreateMessage = WithPayload<WorkerMessageType.PASSKEY_CREATE, PasskeyCreatePayload>;
export type PasskeyGetMessage = WithPayload<WorkerMessageType.PASSKEY_GET, PasskeyGetPayload>;
export type PasskeyInterceptMessage = { type: WorkerMessageType.PASSKEY_INTERCEPT };
export type PasskeyQueryMessage = WithPayload<WorkerMessageType.PASSKEY_QUERY, PasskeyQueryPayload>;
export type PauseWebsiteMessage = WithPayload<WorkerMessageType.PAUSE_WEBSITE, PauseListEntry>;
export type PermissionsUpdateMessage = WithPayload<WorkerMessageType.PERMISSIONS_UPDATE, { check: boolean }>;
export type PingMessage = { type: WorkerMessageType.PING };
export type PopupInitMessage = WithPayload<WorkerMessageType.POPUP_INIT, { tabId: TabId }>;
export type PortUnauthorizedMessage = { type: WorkerMessageType.PORT_UNAUTHORIZED };
export type RegisterElementsMessage = { type: WorkerMessageType.REGISTER_ELEMENTS };
export type ResolveExtensionKeyMessage = { type: WorkerMessageType.RESOLVE_EXTENSION_KEY };
export type ResolveUserDataMessage = { type: WorkerMessageType.RESOLVE_USER };
export type SentryCSEventMessage = WithPayload<WorkerMessageType.SENTRY_CS_EVENT, { message: string; data: any }>;
export type SettingsUpdateMessage = WithPayload<WorkerMessageType.SETTINGS_UPDATE, ProxiedSettings>;
export type StartContentScriptMessage = { type: WorkerMessageType.START_CONTENT_SCRIPT };
export type StoreActionMessage = WithPayload<WorkerMessageType.STORE_DISPATCH, { action: Action }>;
export type TabsQueryMessage = WithPayload<WorkerMessageType.TABS_QUERY, { current?: boolean }>;
export type TelemetryEventMessage = WithPayload<WorkerMessageType.TELEMETRY_EVENT, { event: TelemetryEvent }>;
export type UnloadContentScriptMessage = { type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT };
export type UpdateAvailableMessage = { type: WorkerMessageType.UPDATE_AVAILABLE };
export type WebsiteRulesMessage = { type: WorkerMessageType.WEBSITE_RULES_REQUEST };
export type WorkerReloadMessage = { type: WorkerMessageType.WORKER_RELOAD };
export type WorkerStateChangeMessage = WithPayload<WorkerMessageType.WORKER_STATE_CHANGE, { state: AppState }>;
export type WorkerWakeUpMessage = WithPayload<WorkerMessageType.WORKER_WAKEUP, { tabId: TabId }>;

export type WorkerMessage =
    | AccountAuthExtMessage
    | AccountForkMessage
    | AccountPassOnboardingMessage
    | AccountProbeMessage
    | AliasCreateMessage
    | AliasOptionsMessage
    | AuthCheckMessage
    | AuthConfirmPasswordMessage
    | AuthInitMessage
    | AuthUnlockMessage
    | AutofillIdentityMessage
    | AutofillIdentityQueryMessage
    | AutofillLoginMessage
    | AutofillLoginQueryMessage
    | AutofillOTPCheckMessage
    | AutofillPasswordOptionsMessage
    | AutofillSyncMessage
    | AutoSaveRequestMessage
    | B2BEventMessage
    | DebugMessage
    | ExportRequestMessage
    | FeatureFlagsUpdateMessage
    | FetchAbortMessage
    | FetchDomainImageMessage
    | FormEntryCommitMessage
    | FormEntryRequestMessage
    | FormEntryStageMessage
    | FormEntryStashMessage
    | FormStatusMessage
    | ImportDecryptMessage
    | WebsiteRulesMessage
    | LoadContentScriptMessage
    | LocaleRequestMessage
    | LocaleUpdatedMessage
    | LogEventMessage
    | LogRequestMessage
    | Monitor2FAsMessage
    | MonitorWeakPasswordsMessage
    | NotificationMessage
    | OnboardingAckMessage
    | OnboardingCheckMessage
    | OnboardingRequestMessage
    | OTPCodeGenerateMessage
    | PassCoreRPCMessage
    | PasskeyCreateMessage
    | PasskeyGetMessage
    | PasskeyInterceptMessage
    | PasskeyQueryMessage
    | PauseWebsiteMessage
    | PermissionsUpdateMessage
    | PingMessage
    | PopupInitMessage
    | PortFrameForwardingMessage
    | PortUnauthorizedMessage
    | RegisterElementsMessage
    | ResolveExtensionKeyMessage
    | ResolveUserDataMessage
    | SentryCSEventMessage
    | SettingsUpdateMessage
    | StartContentScriptMessage
    | StoreActionMessage
    | TabsQueryMessage
    | TelemetryEventMessage
    | UnloadContentScriptMessage
    | UpdateAvailableMessage
    | WorkerReloadMessage
    | WorkerStateChangeMessage
    | WorkerWakeUpMessage;

export type MessageFailure = { type: 'error'; error: string; critical?: boolean; payload?: string };
export type MessageSuccess<T> = T extends { [key: string]: any } ? T & { type: 'success' } : { type: 'success' };
export type MaybeMessage<T> = MessageSuccess<T> | MessageFailure;
export type Result<T = {}, F = {}> = ({ ok: true } & T) | ({ ok: false; error: MaybeNull<string> } & F);

type WorkerMessageResponseMap = {
    [WorkerMessageType.ACCOUNT_FORK]: { payload: ExtensionForkResultPayload };
    [WorkerMessageType.ALIAS_CREATE]: Result;
    [WorkerMessageType.ALIAS_OPTIONS]: Result<{ options: AliasOptions; needsUpgrade: boolean }>;
    [WorkerMessageType.AUTH_CHECK]: Result<{ locked: boolean }, {}>;
    [WorkerMessageType.AUTH_CONFIRM_PASSWORD]: Result;
    [WorkerMessageType.AUTH_INIT]: AppState;
    [WorkerMessageType.AUTH_UNLOCK]: Result;
    [WorkerMessageType.AUTOFILL_IDENTITY_QUERY]: AutofillIdentityResult;
    [WorkerMessageType.AUTOFILL_IDENTITY]: ItemContent<'identity'>;
    [WorkerMessageType.AUTOFILL_LOGIN_QUERY]: AutofillLoginResult;
    [WorkerMessageType.AUTOFILL_LOGIN]: FormCredentials;
    [WorkerMessageType.AUTOFILL_OTP_CHECK]: { shouldPrompt: false } | ({ shouldPrompt: true } & SelectedItem);
    [WorkerMessageType.AUTOSUGGEST_PASSWORD]: PasswordAutosuggestOptions;
    [WorkerMessageType.EXPORT_REQUEST]: { file: TransferableFile };
    [WorkerMessageType.FETCH_DOMAINIMAGE]: { result: Maybe<string> };
    [WorkerMessageType.FORM_ENTRY_COMMIT]: { submission: MaybeNull<AutosaveFormEntry> };
    [WorkerMessageType.FORM_ENTRY_REQUEST]: { submission: MaybeNull<AutosaveFormEntry> };
    [WorkerMessageType.FORM_ENTRY_STAGE]: { submission: MaybeNull<AutosaveFormEntry> };
    [WorkerMessageType.IMPORT_DECRYPT]: { payload: ImportReaderPayload };
    [WorkerMessageType.WEBSITE_RULES_REQUEST]: { rules: MaybeNull<ExclusionRules> };
    [WorkerMessageType.LOCALE_REQUEST]: { locale: string };
    [WorkerMessageType.LOG_REQUEST]: { logs: string[] };
    [WorkerMessageType.MONITOR_2FAS]: { result: UniqueItem[] };
    [WorkerMessageType.MONITOR_WEAK_PASSWORDS]: { result: UniqueItem[] };
    [WorkerMessageType.ONBOARDING_CHECK]: { enabled: boolean };
    [WorkerMessageType.ONBOARDING_REQUEST]: { message: MaybeNull<OnboardingMessage> };
    [WorkerMessageType.OTP_CODE_GENERATE]: OtpCode;
    [WorkerMessageType.PASS_CORE_RPC]: { result: PassCoreResult<PassCoreMethod> };
    [WorkerMessageType.PASSKEY_CREATE]: PasskeyCreateResponse;
    [WorkerMessageType.PASSKEY_GET]: PasskeyGetResponse;
    [WorkerMessageType.PASSKEY_INTERCEPT]: { intercept: boolean };
    [WorkerMessageType.PASSKEY_QUERY]: { passkeys: SelectedPasskey[] };
    [WorkerMessageType.POPUP_INIT]: PopupInitialState;
    [WorkerMessageType.REGISTER_ELEMENTS]: { hash: string };
    [WorkerMessageType.RESOLVE_EXTENSION_KEY]: { key: string };
    [WorkerMessageType.RESOLVE_USER]: { user: MaybeNull<User> };
    [WorkerMessageType.TABS_QUERY]: TabInfo;
    [WorkerMessageType.WORKER_WAKEUP]: { state: AppState; settings: ProxiedSettings; features: FeatureFlagState };
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
