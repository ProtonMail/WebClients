import type { PrivateKeyReference } from '@proton/crypto';

export interface ImportKeyData {
    id: string;
    privateKey: PrivateKeyReference;
}
