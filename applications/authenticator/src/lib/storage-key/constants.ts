import { utf8StringToUint8Array } from '@proton/crypto/lib/utils';

export const STORAGE_KEY_IDB_ID = 'authenticator::storage-secret';
export const STORAGE_KEY_HKDF_INFO = utf8StringToUint8Array('authenticator;storage-key');
export const STORAGE_KEY_SALT_LENGTH = 32;
