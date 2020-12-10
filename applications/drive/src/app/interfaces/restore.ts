import { API_CODES } from 'proton-shared/lib/constants';

export enum RESTORE_STATUS_CODE {
    RESTORED = 1000,
    ALREADY_EXISTS = 2500,
}

export interface RestoreFromTrashResult {
    Code: API_CODES;
    Responses: { Response: RestoreResponse }[];
}

export interface RestoreResponse {
    Code: RESTORE_STATUS_CODE;
    Error?: string;
}
