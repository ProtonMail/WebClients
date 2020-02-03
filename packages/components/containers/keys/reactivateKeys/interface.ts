import React from 'react';
import { OpenPGPKey } from 'pmcrypto';
import { Address, CachedKey } from 'proton-shared/lib/interfaces';

export enum Status {
    INACTIVE = 1,
    UPLOADED = 2,
    SUCCESS = 3,
    LOADING = 4,
    ERROR = 5
}

export interface KeyReactivation {
    Address?: Address;
    User?: any;
    keys: CachedKey[];
}

export interface ReactivateKey {
    ID: string;
    fingerprint?: string;
    uploadedPrivateKey?: OpenPGPKey;
    status: Status;
    result?: any;
}

export interface ReactivateKeys {
    Address?: Address;
    User?: any;
    keys: ReactivateKey[];
}

export type SetKeysToReactivate = React.Dispatch<React.SetStateAction<ReactivateKeys[]>>;

export interface OnProcessArguments {
    keysToReactivate: ReactivateKeys[];
    setKeysToReactivate: SetKeysToReactivate;
    isUploadMode: boolean;
    oldPassword?: string;
}
