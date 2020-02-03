import React from 'react';
import { OpenPGPKey } from 'pmcrypto';

export enum Status {
    SUCCESS = 1,
    LOADING = 2,
    ERROR = 3
}

export interface ImportKey {
    fingerprint: string;
    privateKey: OpenPGPKey;
    status: Status;
    result?: any;
}

export type SetKeys = React.Dispatch<React.SetStateAction<ImportKey[]>>;
export interface OnProcessArguments {
    keysToImport: ImportKey[];
    setKeysToImport: SetKeys;
}
