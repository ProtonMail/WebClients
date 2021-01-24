import { OpenPGPKey } from 'pmcrypto';

export interface KeyImportData {
    id: string;
    privateKey: OpenPGPKey;
}

export type OnKeyImportCallback = (id: string, result: 'ok' | Error) => void;
