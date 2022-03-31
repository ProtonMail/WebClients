import { PrivateKeyReference } from '@proton/crypto';

export interface KeyImportData {
    id: string;
    privateKey: PrivateKeyReference;
}

export type OnKeyImportCallback = (id: string, result: 'ok' | Error) => void;
