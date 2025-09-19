import { stringToUtf8Array } from '@proton/crypto/lib/utils';

export const STORAGE_KEY_IDB_ID = 'authenticator::storage-secret';
export const STORAGE_KEY_HKDF_INFO = stringToUtf8Array('authenticator;storage-key');
export const STORAGE_KEY_SALT_LENGTH = 32;
