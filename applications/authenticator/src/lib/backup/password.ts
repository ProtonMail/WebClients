import { AuthenticatorEncryptionTag } from 'proton-authenticator/lib/crypto';
import { StorageKey } from 'proton-authenticator/lib/db/db';

import { decryptData, encryptData } from '@proton/crypto/lib/subtle/aesGcm';
import { utf8StringToUint8Array, uint8ArrayToUtf8String } from '@proton/crypto/lib/utils';
import type { Maybe } from '@proton/pass/types';

const BACKUP_PWD_KEY = 'backup_pw';
const ENCRYPTION_TAG = utf8StringToUint8Array(AuthenticatorEncryptionTag.BackupPassword);

export const setBackupPassword = (encryptedPassword: string) => localStorage.setItem(BACKUP_PWD_KEY, encryptedPassword);
export const getBackupPassword = () => localStorage.getItem(BACKUP_PWD_KEY);
export const clearBackupPassword = () => localStorage.removeItem(BACKUP_PWD_KEY);

export const encryptBackupPassword = async (password: string): Promise<string> => {
    const key = StorageKey.read();
    const bytes = utf8StringToUint8Array(password);
    const encrypted = await encryptData(key, bytes, ENCRYPTION_TAG);

    return encrypted.toBase64();
};

export const decryptBackupPassword = async (encryptedPassword: string): Promise<string> => {
    const key = StorageKey.read();
    const bytes = Uint8Array.fromBase64(encryptedPassword);
    const decrypted = await decryptData(key, bytes, ENCRYPTION_TAG);

    return uint8ArrayToUtf8String(decrypted);
};

export const saveBackupPassword = async (password: string): Promise<void> => {
    const encrypted = await encryptBackupPassword(password);
    setBackupPassword(encrypted);
};

export const resolveBackupPassword = async (): Promise<Maybe<string>> => {
    const encrypted = getBackupPassword();
    if (encrypted) return decryptBackupPassword(encrypted);
};

if (process.env.QA_BUILD) {
    const self = window as any;
    self['qa::backup::downgrade'] = () => {
        clearBackupPassword();
        location.reload();
    };
}
