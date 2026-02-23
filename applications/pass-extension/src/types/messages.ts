import type { ClusterFrame } from 'proton-pass-extension/app/worker/services/autofill.cc';
import type { AutofillActionDTO, AutofillRequest, AutofillResult } from 'proton-pass-extension/types/autofill';
import type {
    FrameAttributes,
    FrameCheckResult,
    FrameField,
    FrameFormsResult,
    FrameQueryDTO,
    FrameQueryResult,
} from 'proton-pass-extension/types/frames';
import type {
    DropdownCloseDTO,
    DropdownClosedDTO,
    DropdownOpenDTO,
    DropdownOpenedDTO,
    DropdownStateDTO,
    IconShiftRequest,
    IconShiftResult,
} from 'proton-pass-extension/types/inline';
import type { Action } from 'redux';

import type { UnlockDTO } from '@proton/pass/lib/auth/lock/types';
import type { AuthOptions } from '@proton/pass/lib/auth/service';
import type { ClipboardAutoClearDTO, ClipboardWriteDTO } from '@proton/pass/lib/clipboard/types';
import type { PassCoreMethod, PassCoreRPC, PassCoreResult } from '@proton/pass/lib/core/core.types';
import type { DetectionRulesMatch } from '@proton/pass/lib/extension/rules/types';
import type {
    PasskeyCreatePayload,
    PasskeyCreateResponse,
    PasskeyGetPayload,
    PasskeyGetResponse,
    PasskeyQueryPayload,
    SelectedPasskey,
} from '@proton/pass/lib/passkeys/types';
import type { PasswordAutosuggestOptions } from '@proton/pass/lib/password/types';
import type { PauseListEntry } from '@proton/pass/lib/settings/pause-list';
import type { Notification } from '@proton/pass/store/actions/enhancers/notification';
import type { FeatureFlagState, VaultShareItem } from '@proton/pass/store/reducers';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { ForkPayload } from '@proton/pass/types/api/fork';
import type { ShareId } from '@proton/pass/types/crypto/pass-types';
import type { AliasOptions } from '@proton/pass/types/data/alias';
import type { B2BEvent } from '@proton/pass/types/data/b2b';
import type { FileTransferErrorDTO, FileTransferWriteDTO } from '@proton/pass/types/data/files';
import type { ItemContent, SelectedItem, UniqueItem } from '@proton/pass/types/data/items';
import type { AliasCreateRequest } from '@proton/pass/types/data/items.dto';
import type { TelemetryEventDTO } from '@proton/pass/types/data/telemetry';
import type { Maybe, MaybeNull, Result } from '@proton/pass/types/utils/index';
import type {
    AutofillCCResult,
    AutofillIdentityResult,
    AutofillLoginResult,
    AutofillOptions,
} from '@proton/pass/types/worker/autofill';
import type { AutosaveRequest } from '@proton/pass/types/worker/autosave';
import type { LoginItemPreview } from '@proton/pass/types/worker/data';
import type {
    AutosaveFormEntry,
    FormCredentials,
    FormStatusPayload,
    FormSubmitPayload,
} from '@proton/pass/types/worker/form';
import type { OtpCode, OtpRequest } from '@proton/pass/types/worker/otp';
import type { ClientEndpoint, EndpointContext, TabId } from '@proton/pass/types/worker/runtime';
import type { SpotlightMessage } from '@proton/pass/types/worker/spotlight';
import type { AppState, PopupInitialState } from '@proton/pass/types/worker/state';
import type { ExtensionForkResultPayload } from '@proton/shared/lib/authentication/fork/extension';
import type { PullForkResponse } from '@proton/shared/lib/authentication/interface';
import type { User } from '@proton/shared/lib/interfaces';

type WithPayload<T extends WorkerMessageType, P extends {}> = { type: T; payload: P };

export type WorkerMessageWithSender<T extends WorkerMessage = WorkerMessage> = T & {
    sender: ClientEndpoint;
    receiver?: ClientEndpoint;
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
    AUTH_PULL_FORK = 'AUTH_PULL_FORK',
    AUTH_UNLOCK = 'AUTH_UNLOCK',

    AUTOFILL_CC = 'AUTOFILL_CC',
    AUTOFILL_CC_QUERY = 'AUTOFILL_CC_QUERY',
    AUTOFILL_IDENTITY = 'AUTOFILL_IDENTITY',
    AUTOFILL_IDENTITY_QUERY = 'AUTOFILL_IDENTITY_QUERY',
    AUTOFILL_LOGIN = 'AUTOFILL_LOGIN',
    AUTOFILL_LOGIN_QUERY = 'AUTOFILL_LOGIN_QUERY',
    AUTOFILL_OTP_CHECK = 'AUTOFILL_OTP_CHECK',
    AUTOFILL_SEQUENCE = 'AUTOFILL_SEQUENCE',
    AUTOFILL_SYNC = 'AUTOFILL_SYNC',

    AUTOSAVE_REQUEST = 'AUTOSAVE_REQUEST',
    AUTOSUGGEST_PASSWORD = 'AUTOSUGGEST_PASSWORD',
    B2B_EVENT = 'B2B_EVENT',
    CLIENT_INIT = 'CLIENT_INIT',
    CLIPBOARD_AUTOCLEAR = 'CLIPBOARD_AUTOCLEAR',
    CLIPBOARD_OFFSCREEN_READ = 'CLIPBOARD_OFFSCREEN_READ',
    CLIPBOARD_OFFSCREEN_WRITE = 'CLIPBOARD_OFFSCREEN_WRITE',
    DEBUG = 'DEBUG',
    ENDPOINT_INIT = 'ENDPOINT_INIT',
    FEATURE_FLAGS_UPDATE = 'FEATURE_FLAGS_UPDATE',
    FETCH_ABORT = 'FETCH_ABORT',
    FETCH_DOMAINIMAGE = 'FETCH_DOMAINIMAGE',
    FORM_ENTRY_COMMIT = 'FORM_ENTRY_COMMIT',
    FORM_ENTRY_REQUEST = 'FORM_ENTRY_REQUEST',
    FORM_ENTRY_STAGE = 'FORM_ENTRY_STAGE',
    FORM_ENTRY_STASH = 'FORM_ENTRY_STASH',
    FORM_STATUS = 'FORM_STATUS',
    FS_WRITE = 'FS_WRITE',
    FS_ERROR = 'FS_ERROR',

    INLINE_DROPDOWN_ATTACH = 'INLINE_DROPDOWN_ATTACH',
    INLINE_DROPDOWN_CLOSE = 'INLINE_DROPDOWN_CLOSE',
    INLINE_DROPDOWN_CLOSED = 'INLINE_DROPDOWN_CLOSED',
    INLINE_DROPDOWN_OPENED = 'INLINE_DROPDOWN_OPENED',
    INLINE_DROPDOWN_STATE = 'INLINE_DROPDOWN_STATE',
    INLINE_DROPDOWN_TOGGLE = 'INLINE_DROPDOWN_TOGGLE',
    INLINE_ICON_SHIFT = 'INLINE_ICON_SHIFT',
    INLINE_ICON_ATTACHED = 'INLINE_ICON_ATTACHED',

    FRAME_DEFERRED_INIT = 'FRAME_DEFERRED_INIT',
    FRAME_FIELD_LOCK = 'FRAME_FIELD_LOCK',
    FRAME_FORM_CLUSTER = 'FRAME_FORM_CLUSTER',
    FRAME_FORMS_QUERY = 'FRAME_FORMS_QUERY',
    FRAME_QUERY = 'FRAME_QUERY',
    FRAME_VISIBILITY = 'FRAME_VISIBILITY',

    LOAD_CONTENT_SCRIPT = 'LOAD_CONTENT_SCRIPT',
    LOCALE_UPDATED = 'LOCALE_UPDATED',
    LOG_EVENT = 'LOG_EVENT',
    LOG_REQUEST = 'LOG_REQUEST',
    MONITOR_2FAS = 'MONITOR_2FAS',
    MONITOR_WEAK_PASSWORDS = 'MONITOR_WEAK_PASSWORDS',
    NOTIFICATION = 'NOTIFICATION',
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
    REGISTER_ELEMENTS_FALLBACK = 'REGISTER_ELEMENTS_FALLBACK',
    RESOLVE_EXTENSION_KEY = 'RESOLVE_EXTENSION_KEY',
    RESOLVE_USER = 'RESOLVE_USER',
    SENTRY_CS_EVENT = 'SENTRY_CS_EVENT',
    SETTINGS_UPDATE = 'SETTINGS_UPDATE',
    SPOTLIGHT_ACK = 'SPOTLIGHT_ACK',
    SPOTLIGHT_CHECK = 'SPOTLIGHT_CHECK',
    SPOTLIGHT_REQUEST = 'SPOTLIGHT_REQUEST',
    STORE_DISPATCH = 'STORE_DISPATCH',
    TELEMETRY_EVENT = 'TELEMETRY_EVENT',
    UNLOAD_CONTENT_SCRIPT = 'UNLOAD_CONTENT_SCRIPT',
    UPDATE_AVAILABLE = 'UPDATE_AVAILABLE',
    VAULTS_QUERY = 'VAULTS_QUERY',
    WEBSITE_RULES_REQUEST = 'WEBSITE_RULES_REQUEST',
    WORKER_RELOAD = 'WORKER_RELOAD',
    WORKER_STATE_CHANGE = 'WORKER_STATE_CHANGE',
}

/* messages for communication with account */
export type AccountAuthExtMessage = { type: WorkerMessageType.ACCOUNT_EXTENSION };
export type AccountForkMessage = WithPayload<WorkerMessageType.ACCOUNT_FORK, ForkPayload>;
export type AccountPassOnboardingMessage = { type: WorkerMessageType.ACCOUNT_ONBOARDING };
export type AccountProbeMessage = { type: WorkerMessageType.ACCOUNT_PROBE };

export type AliasCreateMessage = WithPayload<WorkerMessageType.ALIAS_CREATE, AliasCreateRequest>;
export type AliasOptionsMessage = { type: WorkerMessageType.ALIAS_OPTIONS };

export type AuthCheckMessage = WithPayload<WorkerMessageType.AUTH_CHECK, { immediate?: boolean }>;
export type AuthConfirmPasswordMessage = WithPayload<WorkerMessageType.AUTH_CONFIRM_PASSWORD, { password: string }>;
export type AuthInitMessage = { type: WorkerMessageType.AUTH_INIT; options: AuthOptions };
export type AuthPullForkMessage = WithPayload<WorkerMessageType.AUTH_PULL_FORK, { selector: string }>;
export type AuthUnlockMessage = WithPayload<WorkerMessageType.AUTH_UNLOCK, UnlockDTO>;
export type AutofillCCMessage = WithPayload<WorkerMessageType.AUTOFILL_CC, AutofillActionDTO>;

export type AutofillCCQueryMessage = { type: WorkerMessageType.AUTOFILL_CC_QUERY };
export type AutofillIdentityMessage = WithPayload<WorkerMessageType.AUTOFILL_IDENTITY, SelectedItem>;
export type AutofillIdentityQueryMessage = { type: WorkerMessageType.AUTOFILL_IDENTITY_QUERY };
export type AutofillLoginMessage = WithPayload<WorkerMessageType.AUTOFILL_LOGIN, SelectedItem>;
export type AutofillLoginQueryMessage = WithPayload<WorkerMessageType.AUTOFILL_LOGIN_QUERY, AutofillOptions>;
export type AutofillOTPCheckMessage = { type: WorkerMessageType.AUTOFILL_OTP_CHECK };
export type AutofillPasswordOptionsMessage = { type: WorkerMessageType.AUTOSUGGEST_PASSWORD };
export type AutofillSequenceMessage = WithPayload<WorkerMessageType.AUTOFILL_SEQUENCE, AutofillRequest>;
export type AutofillSyncMessage = { type: WorkerMessageType.AUTOFILL_SYNC };

export type AutoSaveRequestMessage = WithPayload<WorkerMessageType.AUTOSAVE_REQUEST, AutosaveRequest>;
export type B2BEventMessage = WithPayload<WorkerMessageType.B2B_EVENT, { event: B2BEvent }>;

export type ClientInitMessage = WithPayload<WorkerMessageType.CLIENT_INIT, { tabId: TabId }>;
export type ClipboardReadMessage = { type: WorkerMessageType.CLIPBOARD_OFFSCREEN_READ };
export type ClipboardWriteMessage = WithPayload<WorkerMessageType.CLIPBOARD_OFFSCREEN_WRITE, ClipboardWriteDTO>;
export type ClipboardAutoClearMessage = WithPayload<WorkerMessageType.CLIPBOARD_AUTOCLEAR, ClipboardAutoClearDTO>;
export type DebugMessage = WithPayload<WorkerMessageType.DEBUG, { debug: string }>;
export type EndpointInitMessage = WithPayload<WorkerMessageType.ENDPOINT_INIT, { popup?: boolean }>;
export type FeatureFlagsUpdateMessage = WithPayload<WorkerMessageType.FEATURE_FLAGS_UPDATE, FeatureFlagState>;
export type FetchAbortMessage = WithPayload<WorkerMessageType.FETCH_ABORT, { requestId: string }>;
export type FetchDomainImageMessage = WithPayload<WorkerMessageType.FETCH_DOMAINIMAGE, { url: string }>;

export type FormEntryCommitMessage = WithPayload<WorkerMessageType.FORM_ENTRY_COMMIT, { reason: string }>;
export type FormEntryRequestMessage = { type: WorkerMessageType.FORM_ENTRY_REQUEST };
export type FormEntryStageMessage = WithPayload<WorkerMessageType.FORM_ENTRY_STAGE, FormSubmitPayload>;
export type FormEntryStashMessage = WithPayload<WorkerMessageType.FORM_ENTRY_STASH, { reason: string }>;
export type FormStatusMessage = WithPayload<WorkerMessageType.FORM_STATUS, FormStatusPayload>;

export type FileTransferWriteMessage = WithPayload<WorkerMessageType.FS_WRITE, FileTransferWriteDTO>;
export type FileTransferErrorMessage = WithPayload<WorkerMessageType.FS_ERROR, FileTransferErrorDTO>;

export type FrameDeferredInitMessage = { type: WorkerMessageType.FRAME_DEFERRED_INIT };
export type FrameFieldLockMessage = WithPayload<WorkerMessageType.FRAME_FIELD_LOCK, FrameField & { locked: boolean }>;
export type FrameFormClusterMessage = { type: WorkerMessageType.FRAME_FORM_CLUSTER };
export type FrameFormsQueryMessage = { type: WorkerMessageType.FRAME_FORMS_QUERY };
export type FrameQueryMessage = WithPayload<WorkerMessageType.FRAME_QUERY, FrameQueryDTO>;
export type FrameVisibilityMessage = WithPayload<WorkerMessageType.FRAME_VISIBILITY, FrameAttributes>;

export type InlineDropdownAttachMessage = { type: WorkerMessageType.INLINE_DROPDOWN_ATTACH };
export type InlineDropdownClosedMessage = WithPayload<WorkerMessageType.INLINE_DROPDOWN_CLOSED, DropdownClosedDTO>;
export type InlineDropdownCloseMessage = WithPayload<WorkerMessageType.INLINE_DROPDOWN_CLOSE, DropdownCloseDTO>;
export type InlineDropdownOpenedMessage = WithPayload<WorkerMessageType.INLINE_DROPDOWN_OPENED, DropdownOpenedDTO>;
export type InlineDropdownStateMessage = { type: WorkerMessageType.INLINE_DROPDOWN_STATE };
export type InlineDropdownToggleMessage = WithPayload<WorkerMessageType.INLINE_DROPDOWN_TOGGLE, DropdownOpenDTO>;
export type InlineIconAttachedMessage = WithPayload<WorkerMessageType.INLINE_ICON_ATTACHED, FrameField>;
export type InlineIconShiftMessage = WithPayload<WorkerMessageType.INLINE_ICON_SHIFT, IconShiftRequest>;

export type LoadContentScriptMessage = { type: WorkerMessageType.LOAD_CONTENT_SCRIPT };
export type LocaleUpdatedMessage = WithPayload<WorkerMessageType.LOCALE_UPDATED, { locale: string }>;
export type LogEventMessage = WithPayload<WorkerMessageType.LOG_EVENT, { log: string }>;
export type LogRequestMessage = { type: WorkerMessageType.LOG_REQUEST };
export type Monitor2FAsMessage = { type: WorkerMessageType.MONITOR_2FAS };
export type MonitorWeakPasswordsMessage = { type: WorkerMessageType.MONITOR_WEAK_PASSWORDS };
export type NotificationMessage = WithPayload<WorkerMessageType.NOTIFICATION, { notification: Notification }>;
export type OTPCodeGenerateMessage = WithPayload<WorkerMessageType.OTP_CODE_GENERATE, OtpRequest>;
export type PassCoreRPCMessage = WithPayload<WorkerMessageType.PASS_CORE_RPC, PassCoreRPC<PassCoreMethod>>;
export type PasskeyCreateMessage = WithPayload<WorkerMessageType.PASSKEY_CREATE, PasskeyCreatePayload>;
export type PasskeyGetMessage = WithPayload<WorkerMessageType.PASSKEY_GET, PasskeyGetPayload>;
export type PasskeyInterceptMessage = WithPayload<WorkerMessageType.PASSKEY_INTERCEPT, { reason: string }>;
export type PasskeyQueryMessage = WithPayload<WorkerMessageType.PASSKEY_QUERY, PasskeyQueryPayload>;
export type PauseWebsiteMessage = WithPayload<WorkerMessageType.PAUSE_WEBSITE, PauseListEntry>;
export type PermissionsUpdateMessage = WithPayload<WorkerMessageType.PERMISSIONS_UPDATE, { granted: boolean }>;
export type PingMessage = { type: WorkerMessageType.PING };
export type PopupInitMessage = WithPayload<WorkerMessageType.POPUP_INIT, { tabId: TabId }>;
export type PortUnauthorizedMessage = { type: WorkerMessageType.PORT_UNAUTHORIZED };
export type RegisterElementsLegacyMessage = WithPayload<WorkerMessageType.REGISTER_ELEMENTS_FALLBACK, { hash: string }>;
export type RegisterElementsMessage = { type: WorkerMessageType.REGISTER_ELEMENTS };
export type ResolveExtensionKeyMessage = { type: WorkerMessageType.RESOLVE_EXTENSION_KEY };
export type ResolveUserDataMessage = { type: WorkerMessageType.RESOLVE_USER };
export type SentryCSEventMessage = WithPayload<WorkerMessageType.SENTRY_CS_EVENT, { message: string; data: any }>;
export type SettingsUpdateMessage = WithPayload<WorkerMessageType.SETTINGS_UPDATE, ProxiedSettings>;
export type SpotlightAckMessage = WithPayload<WorkerMessageType.SPOTLIGHT_ACK, { message: SpotlightMessage }>;
export type SpotlightCheckMessage = WithPayload<WorkerMessageType.SPOTLIGHT_CHECK, { message: SpotlightMessage }>;
export type SpotlightRequestMessage = { type: WorkerMessageType.SPOTLIGHT_REQUEST };
export type StoreActionMessage = WithPayload<WorkerMessageType.STORE_DISPATCH, { action: Action }>;
export type TelemetryEventMessage = WithPayload<WorkerMessageType.TELEMETRY_EVENT, TelemetryEventDTO>;
export type UnloadContentScriptMessage = { type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT };
export type UpdateAvailableMessage = { type: WorkerMessageType.UPDATE_AVAILABLE };
export type VaultsQueryMessage = { type: WorkerMessageType.VAULTS_QUERY };
export type WebsiteRulesMessage = { type: WorkerMessageType.WEBSITE_RULES_REQUEST };
export type WorkerReloadMessage = { type: WorkerMessageType.WORKER_RELOAD };
export type WorkerStateChangeMessage = WithPayload<WorkerMessageType.WORKER_STATE_CHANGE, { state: AppState }>;

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
    | AuthPullForkMessage
    | AuthUnlockMessage
    | AutofillCCMessage
    | AutofillCCQueryMessage
    | AutofillIdentityMessage
    | AutofillIdentityQueryMessage
    | AutofillLoginMessage
    | AutofillLoginQueryMessage
    | AutofillOTPCheckMessage
    | AutofillPasswordOptionsMessage
    | AutofillSequenceMessage
    | AutofillSyncMessage
    | AutoSaveRequestMessage
    | B2BEventMessage
    | ClientInitMessage
    | ClipboardAutoClearMessage
    | ClipboardReadMessage
    | ClipboardWriteMessage
    | DebugMessage
    | EndpointInitMessage
    | FeatureFlagsUpdateMessage
    | FetchAbortMessage
    | FetchDomainImageMessage
    | FileTransferErrorMessage
    | FileTransferWriteMessage
    | FormEntryCommitMessage
    | FormEntryRequestMessage
    | FormEntryStageMessage
    | FormEntryStashMessage
    | FormStatusMessage
    | FrameDeferredInitMessage
    | FrameFieldLockMessage
    | FrameFormClusterMessage
    | FrameFormsQueryMessage
    | FrameQueryMessage
    | FrameVisibilityMessage
    | InlineDropdownAttachMessage
    | InlineDropdownClosedMessage
    | InlineDropdownCloseMessage
    | InlineDropdownOpenedMessage
    | InlineDropdownStateMessage
    | InlineDropdownToggleMessage
    | InlineIconAttachedMessage
    | InlineIconShiftMessage
    | LoadContentScriptMessage
    | LocaleUpdatedMessage
    | LogEventMessage
    | LogRequestMessage
    | Monitor2FAsMessage
    | MonitorWeakPasswordsMessage
    | NotificationMessage
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
    | RegisterElementsLegacyMessage
    | RegisterElementsMessage
    | ResolveExtensionKeyMessage
    | ResolveUserDataMessage
    | SentryCSEventMessage
    | SettingsUpdateMessage
    | SpotlightAckMessage
    | SpotlightCheckMessage
    | SpotlightRequestMessage
    | StoreActionMessage
    | TelemetryEventMessage
    | UnloadContentScriptMessage
    | UpdateAvailableMessage
    | VaultsQueryMessage
    | WebsiteRulesMessage
    | WorkerReloadMessage
    | WorkerStateChangeMessage;

export type MessageFailure = { type: 'error'; error: string; critical?: boolean; payload?: string };
export type MessageSuccess<T> = T extends { [key: string]: any } ? T & { type: 'success' } : { type: 'success' };
export type MaybeMessage<T> = MessageSuccess<T> | MessageFailure;

type WorkerMessageResponseMap = {
    [WorkerMessageType.ACCOUNT_FORK]: { payload: ExtensionForkResultPayload };
    [WorkerMessageType.ALIAS_CREATE]: Result;
    [WorkerMessageType.ALIAS_OPTIONS]: Result<{ options: AliasOptions; needsUpgrade: boolean }>;
    [WorkerMessageType.AUTH_CHECK]: Result<{ locked: boolean }, {}>;
    [WorkerMessageType.AUTH_CONFIRM_PASSWORD]: Result;
    [WorkerMessageType.AUTH_INIT]: AppState;
    [WorkerMessageType.AUTH_PULL_FORK]: Result<PullForkResponse>;
    [WorkerMessageType.AUTH_UNLOCK]: Result;
    [WorkerMessageType.AUTOFILL_CC_QUERY]: AutofillCCResult;
    [WorkerMessageType.AUTOFILL_IDENTITY_QUERY]: AutofillIdentityResult;
    [WorkerMessageType.AUTOFILL_IDENTITY]: ItemContent<'identity'>;
    [WorkerMessageType.AUTOFILL_LOGIN_QUERY]: AutofillLoginResult;
    [WorkerMessageType.AUTOFILL_LOGIN]: FormCredentials;
    [WorkerMessageType.AUTOFILL_OTP_CHECK]: { shouldPrompt: false } | ({ shouldPrompt: true } & LoginItemPreview);
    [WorkerMessageType.AUTOFILL_SEQUENCE]: AutofillResult;
    [WorkerMessageType.AUTOSUGGEST_PASSWORD]: PasswordAutosuggestOptions;
    [WorkerMessageType.CLIENT_INIT]: { state: AppState; settings: ProxiedSettings; features: FeatureFlagState };
    [WorkerMessageType.CLIPBOARD_OFFSCREEN_READ]: { content: string };
    [WorkerMessageType.ENDPOINT_INIT]: EndpointContext;
    [WorkerMessageType.FETCH_DOMAINIMAGE]: { result: Maybe<string> };
    [WorkerMessageType.FORM_ENTRY_COMMIT]: { submission: MaybeNull<AutosaveFormEntry> };
    [WorkerMessageType.FORM_ENTRY_REQUEST]: { submission: MaybeNull<AutosaveFormEntry> };
    [WorkerMessageType.FORM_ENTRY_STAGE]: { submission: MaybeNull<AutosaveFormEntry> };
    [WorkerMessageType.FRAME_FIELD_LOCK]: { wasFocused: boolean };
    [WorkerMessageType.FRAME_FORMS_QUERY]: FrameFormsResult;
    [WorkerMessageType.FRAME_QUERY]: FrameQueryResult;
    [WorkerMessageType.FRAME_VISIBILITY]: FrameCheckResult;
    [WorkerMessageType.FRAME_FORM_CLUSTER]: ClusterFrame;
    [WorkerMessageType.INLINE_DROPDOWN_STATE]: DropdownStateDTO;
    [WorkerMessageType.INLINE_ICON_SHIFT]: IconShiftResult;
    [WorkerMessageType.LOG_REQUEST]: { logs: string[] };
    [WorkerMessageType.MONITOR_2FAS]: { result: UniqueItem[] };
    [WorkerMessageType.MONITOR_WEAK_PASSWORDS]: { result: UniqueItem[] };
    [WorkerMessageType.OTP_CODE_GENERATE]: OtpCode;
    [WorkerMessageType.PASS_CORE_RPC]: { result: PassCoreResult<PassCoreMethod> };
    [WorkerMessageType.PASSKEY_CREATE]: PasskeyCreateResponse;
    [WorkerMessageType.PASSKEY_GET]: PasskeyGetResponse;
    [WorkerMessageType.PASSKEY_INTERCEPT]: { intercept: boolean };
    [WorkerMessageType.PASSKEY_QUERY]: { passkeys: SelectedPasskey[] };
    [WorkerMessageType.POPUP_INIT]: PopupInitialState;
    [WorkerMessageType.REGISTER_ELEMENTS]: { hash: string; scriptFallback: boolean };
    [WorkerMessageType.RESOLVE_EXTENSION_KEY]: { key: string };
    [WorkerMessageType.RESOLVE_USER]: { user: MaybeNull<User> };
    [WorkerMessageType.SPOTLIGHT_CHECK]: { enabled: boolean };
    [WorkerMessageType.SPOTLIGHT_REQUEST]: { message: MaybeNull<SpotlightMessage> };
    [WorkerMessageType.VAULTS_QUERY]: { vaults: VaultShareItem[]; defaultShareId: ShareId };
    [WorkerMessageType.WEBSITE_RULES_REQUEST]: { rules: MaybeNull<DetectionRulesMatch> };
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

export type SendTabResponse<T extends WorkerMessageType = WorkerMessageType> = (res: WorkerMessageResponse<T>) => void;
