export interface PersistedSessionBlob {
    keyPassword: string;
}

export interface PersistedSession {
    UserID: string;
    UID: string;
    blob?: string;
    isSubUser: boolean;
    persistent: boolean;
}

export interface PersistedSessionWithLocalID extends PersistedSession {
    localID: number;
}
