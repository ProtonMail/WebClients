import type { EOState } from './eoType';

export const eoInitialState = {
    encryptedToken: '',
    decryptedToken: '',
    isStoreInitialized: false,
    isEncryptedTokenInitialized: false,
    password: '',
} as EOState;
