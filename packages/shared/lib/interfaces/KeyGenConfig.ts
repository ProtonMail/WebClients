import type { enums } from '@protontech/crypto';

export interface KeyGenConfig {
    type?: 'ecc' | 'rsa';
    curve?: enums.curve;
    rsaBits?: number;
    config?: { v6Keys?: false };
}

/** v6 keys are not compatible with all clients */
export interface KeyGenConfigV6 {
    type?: 'pqc';
    config: { v6Keys: true };
}
