import type { AuthSession } from '@proton/pass/lib/auth/session';
import type { GeneratePasswordOptions } from '@proton/pass/lib/password/generator';
import type { ItemDraft } from '@proton/pass/store/reducers';

import type { ItemFilters, SelectedItem } from '../data';
import type { Maybe, MaybeNull } from '../utils';

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
