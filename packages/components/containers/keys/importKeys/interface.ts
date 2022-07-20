import { PrivateKeyReference } from '@proton/crypto';

export enum Status {
    SUCCESS = 1,
    LOADING = 2,
    ERROR = 3,
}

export interface ImportKey {
    id: string;
    fingerprint: string;
    privateKey: PrivateKeyReference;
    status: Status;
    result?: 'ok' | Error;
}
