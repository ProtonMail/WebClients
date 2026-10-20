import type { ImportKeyData } from '@proton/shared/lib/keys/import/interface';

export enum Status {
    SUCCESS = 1,
    LOADING = 2,
    ERROR = 3,
}

export interface ImportKeyState {
    importKeyData: ImportKeyData;
    fingerprint: string;
    status: Status;
    result?: string;
}
