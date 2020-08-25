export interface PersistedSessionBlob {
    keyPassword: string;
}

export interface PersistedSession {
    UID: string;
    blob?: string;
    isMember?: boolean;
}
