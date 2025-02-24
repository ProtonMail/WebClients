import type { PartialConfig } from 'pmcrypto';
import { ARGON2_PARAMS, VERIFICATION_STATUS } from 'pmcrypto/lib/constants';

export const S2kTypeForConfig: { [key: string]: PartialConfig['s2kType'] } = {
    // Cannot access `enums` value directly to avoid importing openpgp in the main thread
    argon2: 4,
    iterated: 3,
};

export { ARGON2_PARAMS, VERIFICATION_STATUS };

/**
 * Compatibility levels to enforce when importing OpenPGP keys
 */
export enum KeyCompatibilityLevel {
    /** No compatibility checks */
    NONE = 1, // start from 1 to avoid potential oversights due to 0 being falsy
    /** Key must be compatible with all Proton clients */
    BACKWARDS_COMPATIBLE,
    /**
     * Key must be compatible with newer Proton clients that implement v6 key support,
     * but may be incompatible with older clients.
     */
    V6_COMPATIBLE,
}
