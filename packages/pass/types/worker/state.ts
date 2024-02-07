import type { AuthSession } from '@proton/pass/lib/auth/session';

import type { ItemFilters, SelectedItem } from '../data';
import type { Maybe, MaybeNull } from '../utils';

export enum AppStatus {
    IDLE = 'IDLE' /* initial app state - pending initalization */,
    AUTHORIZING = 'AUTHORIZING' /* app is forking a session to login */,
    UNAUTHORIZED = 'UNAUTHORIZED' /* app is pending login */,
    AUTHORIZED = 'AUTHORIZED' /* user is logged in */,
    LOCKED = 'LOCKED' /* app is locked (session may not) */,
    BOOTING = 'BOOTING' /* app is currently in the boot sequence */,
    READY = 'READY' /* app is authorized and has booted */,
    ERROR = 'ERROR' /* app is in an error state */,
}

export type AppState = {
    localID: Maybe<number>;
    loggedIn: boolean;
    status: AppStatus;
    UID: Maybe<string>;
};

export type SessionStoreData = AuthSession;
export type SessionStoreKeys = keyof SessionStoreData;

export type LocalStoreData = {
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
};

export type LocalStoreKeys = keyof LocalStoreData;

export type PopupInitialState = {
    search: MaybeNull<string>;
    filters: MaybeNull<ItemFilters>;
    selectedItem: MaybeNull<SelectedItem>;
};
