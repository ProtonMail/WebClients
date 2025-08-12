import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';
import type { AccessType } from '@proton/shared/lib/authentication/accessType';

export interface LegacySerializedSignoutUserData {
    id: string;
    // isSubUser: legacy passed value
    s: boolean;
    a: number;
}

export interface SerializedSignoutUserData {
    id: string;
    // isSubUser: legacy passed value
    a: number;
}

export interface SignoutUserData {
    id: string;
    accessType: AccessType;
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
