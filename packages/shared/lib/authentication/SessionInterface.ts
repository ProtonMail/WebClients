export interface PersistedSessionBlob {
    keyPassword: string;
}

export interface PersistedSession {
    UserID: string;
    UID: string;
    blob?: string;
    isMember?: boolean;
}
