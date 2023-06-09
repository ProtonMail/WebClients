import type { Maybe } from '../utils';

export enum WorkerStatus {
    IDLE = 'IDLE' /* initial worker state - pending initalization */,
    AUTHORIZING = 'AUTHORIZING' /* worker is forking a session to login */,
    UNAUTHORIZED = 'UNAUTHORIZED' /* worker is pending login */,
    AUTHORIZED = 'AUTHORIZED' /* user is logged in */,
    LOCKED = 'LOCKED' /* worker is locked (session may not) */,
    RESUMING = 'RESUMING' /* worker is trying to resume session */,
    RESUMING_FAILED = 'RESUMING_FAILED' /* session resuming failed */,
    BOOTING = 'BOOTING' /* worker is currently in the boot sequence */,
    READY = 'READY' /* worker is authorized and has booted */,
    ERROR = 'ERROR' /* worker is in an error state */,
}

export type WorkerState = {
    status: WorkerStatus;
    loggedIn: boolean;
    UID: Maybe<string>;
};

export type ExtensionSessionData = {
    UID?: string;
    AccessToken?: string;
    RefreshToken?: string;
    keyPassword?: string;
};

export type ExtensionLocalData = {
    state?: string;
    snapshot?: string;
    salt?: string;
    ps?: string;
    onboarding?: string;
    telemetry?: string;
    settings?: string;
};

export type PopupState = {
    hasAutofillCandidates: boolean;
    initialSearch: string;
};
