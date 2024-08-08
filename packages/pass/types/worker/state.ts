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
    /** Flag indicating whether user is fully authorized and
     * app is ready. Client-specific behaviors: in extension,
     * remains false if B2B lock setup is required; in web,
     * typically true after login sequence completes. */
    authorized: boolean;
    /** Indicates user state has been successfully hydrated
     * and client is fully initialized and ready. */
    booted: boolean;
    /** LocalID of the current active session. Primarily relevant
     * in the extension context. For web/desktop, prefer using
     * the `authStore` directly. */
    localID: Maybe<number>;
    /** Optional flag indicating whether a user requires B2B lock
     * setup. Relevant only in the extension context to propagate
     * this state to "un-connected" extension components. */
    lockSetup?: boolean;
    /** Current client status */
    status: AppStatus;
    /** UID of the current active session. Primarily relevant in
     * the extension context. For web/desktop, prefer using the
     * `authStore` directly. */
    UID: Maybe<string>;
};

export type SessionStoreData = AuthSession;
export type SessionStoreKeys = keyof SessionStoreData;

export type LocalStoreData = {
    b2bEvents: string;
    /** flag indicating if we should force lock on next resume */
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
    websiteRules: string;
};

export type LocalStoreKeys = keyof LocalStoreData;

export type PopupInitialState = {
    search: MaybeNull<string>;
    filters: MaybeNull<ItemFilters>;
    selectedItem: MaybeNull<SelectedItem>;
};
