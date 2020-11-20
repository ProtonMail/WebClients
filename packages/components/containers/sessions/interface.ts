import { getClientsI18N } from './helper';

type ClientIDs = keyof ReturnType<typeof getClientsI18N>;

export interface Session {
    ExpirationTime: number;
    UnlockExpirationTime: number;
    ClientID: ClientIDs;
    CreateTime: number;
    Scope: number;
    ParentUID: null;
    RefreshCounter: number;
    Flags: number;
    AccessExpirationTime: number;
    UID: string;
    Algo: number;
    UserID: number;
    OwnerUserID: number | null;
    MemberID: string;
    Revocable: 1 | 0;
}
