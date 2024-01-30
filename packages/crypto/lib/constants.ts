import type { PartialConfig } from 'pmcrypto';
import { ARGON2_PARAMS, VERIFICATION_STATUS } from 'pmcrypto/lib/constants';

export const S2kTypeForConfig: { [key: string]: PartialConfig['s2kType'] } = {
    // Cannot access `enums` value directly to avoid importing openpgp in the main thread
    argon2: 4,
    iterated: 3,
};

export { ARGON2_PARAMS, VERIFICATION_STATUS };
