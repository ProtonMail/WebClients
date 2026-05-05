import type { PrivateKeyReference } from '@protontech/crypto';

export interface ImportKeyData {
    id: string;
    privateKey: PrivateKeyReference;
}
