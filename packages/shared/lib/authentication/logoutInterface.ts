import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';

export interface SerializedSignoutUserData {
    id: string;
    // isSubUser: legacy passed value
    s: boolean;
}

export interface SignoutUserData {
    id: string;
    isSelf: boolean;
}

export interface SignoutSessions {
    type: 'all' | 'self';
    sessions: PersistedSession[];
    // Users may contain more data than sessions, since there could be a user without a persisted session
    users: SignoutUserData[];
}

export interface SignoutActionOptions extends SignoutSessions {
    type: 'all' | 'self';
    reason: 'signout' | 'session-expired';
    clearDeviceRecovery: boolean;
}
