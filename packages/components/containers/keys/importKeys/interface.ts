import { OpenPGPKey } from 'pmcrypto';

export enum Status {
    SUCCESS = 1,
    LOADING = 2,
    ERROR = 3,
}

export interface ImportKey {
    id: string;
    fingerprint: string;
    privateKey: OpenPGPKey;
    status: Status;
    result?: 'ok' | Error;
}
