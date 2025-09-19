import { AuthenticatorEncryptionTag } from 'proton-authenticator/lib/crypto';
import { StorageKey } from 'proton-authenticator/lib/db/db';

import { decryptData, encryptData } from '@proton/crypto/lib/subtle/aesGcm';
import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils';
import type { Maybe } from '@proton/pass/types';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

const BACKUP_PWD_KEY = 'backup_pw';
const ENCRYPTION_TAG = stringToUtf8Array(AuthenticatorEncryptionTag.BackupPassword);

export const setBackupPassword = (encryptedPassword: string) => localStorage.setItem(BACKUP_PWD_KEY, encryptedPassword);
export const getBackupPassword = () => localStorage.getItem(BACKUP_PWD_KEY);
export const clearBackupPassword = () => localStorage.removeItem(BACKUP_PWD_KEY);

export const encryptBackupPassword = async (password: string): Promise<string> => {
    const key = StorageKey.read();
    const bytes = stringToUtf8Array(password);
    const encrypted = await encryptData(key, bytes, ENCRYPTION_TAG);

    return uint8ArrayToBase64String(encrypted);
};

export const decryptBackupPassword = async (encryptedPassword: string): Promise<string> => {
    const key = StorageKey.read();
    const bytes = base64StringToUint8Array(encryptedPassword);
    const decrypted = await decryptData(key, bytes, ENCRYPTION_TAG);

    return utf8ArrayToString(decrypted);
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
