import type { AuthSession } from '@proton/pass/lib/auth/session';

import type { ItemFilters, SelectedItem } from '../data';
import type { Maybe, MaybeNull } from '../utils';

export enum AppStatus {
    AUTHORIZED = 'AUTHORIZED' /* user is logged in */,
    AUTHORIZING = 'AUTHORIZING' /* app is forking a session to login */,
    BOOTING = 'BOOTING' /* app is currently in the boot sequence */,
    ERROR = 'ERROR' /* app is in an error state */,
    IDLE = 'IDLE' /* initial app state - pending initalization */,
    OFFLINE = 'OFFLINE' /* app is unlocked for offline usage */,
    PASSWORD_LOCKED = 'PASSWORD_LOCKED' /* offline locked app */,
    BIOMETRICS_LOCKED = 'BIOMETRICS_LOCKED' /* biometrics locked app */,
    READY = 'READY' /* app is authorized and has booted */,
    SESSION_LOCKED = 'SESSION_LOCKED' /* session is locked back-end side */,
    UNAUTHORIZED = 'UNAUTHORIZED' /* app is pending login */,
    MISSING_SCOPE = 'MISSING_SCOPE' /* app needs extra password */,
}

export type AppState = {
    booted: boolean;
    localID: Maybe<number>;
    lockSetup?: boolean;
    loggedIn: boolean;
    status: AppStatus;
    UID: Maybe<string>;
};

export type SessionStoreData = AuthSession;
export type SessionStoreKeys = keyof SessionStoreData;

export type LocalStoreData = {
    /** flag indicating if we should force lock on next resume */
    b2bEvents: string;
    forceLock: boolean;
    lastReload: number;
    logs: string;
    onboarding: string;
    ps: string;
    salt: string;
    settings: string;
    snapshot: string;
    state: string;
    telemetry: string;
    version: string;
};

export type LocalStoreKeys = keyof LocalStoreData;

export type PopupInitialState = {
    search: MaybeNull<string>;
    filters: MaybeNull<ItemFilters>;
    selectedItem: MaybeNull<SelectedItem>;
};
