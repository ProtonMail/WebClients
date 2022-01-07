export interface Session {
    ExpirationTime: number;
    UnlockExpirationTime: number;
    ClientID: string;
    LocalizedClientName: string;
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
