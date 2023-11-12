import type { AuthSession } from '@proton/pass/lib/auth/session';
import type { GeneratePasswordOptions } from '@proton/pass/lib/password/generator';
import type { ItemDraft } from '@proton/pass/store/reducers';

import type { ItemFilters, SelectedItem } from '../data';
import type { Maybe, MaybeNull } from '../utils';

export enum AppStatus {
    IDLE = 'IDLE' /* initial app state - pending initalization */,
    AUTHORIZING = 'AUTHORIZING' /* app is forking a session to login */,
    UNAUTHORIZED = 'UNAUTHORIZED' /* app is pending login */,
    AUTHORIZED = 'AUTHORIZED' /* user is logged in */,
    LOCKED = 'LOCKED' /* app is locked (session may not) */,
    RESUMING = 'RESUMING' /* app is trying to resume session */,
    RESUMING_FAILED = 'RESUMING_FAILED' /* session resuming failed */,
    BOOTING = 'BOOTING' /* app is currently in the boot sequence */,
    READY = 'READY' /* app is authorized and has booted */,
    ERROR = 'ERROR' /* app is in an error state */,
}

export type AppState = {
    status: AppStatus;
    loggedIn: boolean;
    UID: Maybe<string>;
};

export type SessionStoreData = AuthSession;
export type SessionStoreKeys = keyof SessionStoreData;

export type LocalStoreData = {
    version: string;
    state: string;
    snapshot: string;
    salt: string;
    ps: string;
    onboarding: string;
    telemetry: string;
    settings: string;
};

export type LocalStoreKeys = keyof LocalStoreData;

export type PopupInitialState = {
    search: MaybeNull<string>;
    draft: MaybeNull<ItemDraft>;
    filters: MaybeNull<ItemFilters>;
    selectedItem: MaybeNull<SelectedItem>;
    passwordOptions: MaybeNull<GeneratePasswordOptions>;
};
