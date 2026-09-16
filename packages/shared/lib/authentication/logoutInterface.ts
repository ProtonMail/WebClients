import type { PersistedSession } from './SessionInterface';
import type { AccessType } from './accessType';

export interface LegacySerializedSignoutUserData {
    id: string;
    // isSubUser: legacy passed value
    s: boolean;
    a: number;
}

export interface SerializedSignoutUserData {
    // The session's local id
    l: number;
    id: string;
    // (legacy) The session's access type. Only present on a URL serialized before the local id was sent.
    a?: number;
}

// What a signout built here carries: which session it means, by local id
export interface SignoutUserData {
    id: string;
    localID: number;
}

// What a signout URL can be read as, a local id or the access type a client predating it sent
export type ParsedSignoutUserData = { id: string } & (
    { localID: number; accessType?: never } | { localID?: never; accessType: AccessType }
);

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
    logoutRedirectUrl?: string;
}
