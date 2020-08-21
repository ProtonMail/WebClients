import { OpenPGPKey } from 'pmcrypto';

export interface ActionableKey {
    privateKey: OpenPGPKey;
    primary: 1 | 0;
    flags: number;
    ID: string;
}
