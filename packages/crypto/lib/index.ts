import type { PartialConfig } from 'pmcrypto';

export * from './serverTime';
export * from './proxy';
export * from './worker/api.models';

export const S2kTypeForConfig: { [key: string]: PartialConfig['s2kType'] } = {
    // Cannot access `enums` value directly to avoid importing openpgp in the main thread
    argon2: 4,
    iterated: 3,
};
