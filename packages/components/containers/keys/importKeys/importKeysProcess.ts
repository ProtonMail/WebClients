import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { Address, CachedKey, KeyAction, Api } from 'proton-shared/lib/interfaces';
import { findKeyByFingerprint } from 'proton-shared/lib/keys/keysAction';
import { reformatAddressKey } from 'proton-shared/lib/keys/keys';
import { SetKeys, ImportKey, Status } from './interface';
import createKeyHelper from '../addKey/createKeyHelper';
import { reactivateByUpload, reactivatePrivateKey } from '../reactivateKeys/reactivateHelper';
import { updateKey } from './state';

interface Arguments {
    api: Api;
    signingKey: OpenPGPKey;
    keysToImport: ImportKey[];
    setKeysToImport: SetKeys;
    addressKeys: CachedKey[];
    password: string;
    keys: KeyAction[];
    Address: Address;
}
export default async ({
    api,
    keysToImport,
    addressKeys,
    signingKey,
    password,
    keys,
    setKeysToImport,
    Address,
}: Arguments) => {
    let updatedAddressKeys = keys;

    for (const key of keysToImport) {
        try {
            const { privateKey: uploadedPrivateKey, fingerprint } = key;

            const maybeOldKeyContainer = findKeyByFingerprint(updatedAddressKeys, fingerprint);
            const maybeOldKey = maybeOldKeyContainer
                ? addressKeys.find(({ Key: { ID } }) => ID === maybeOldKeyContainer.ID)
                : undefined;

            if (maybeOldKey) {
                const {
                    Key: { ID, PrivateKey },
                    privateKey: oldPrivateKey,
                } = maybeOldKey;

                if (oldPrivateKey && oldPrivateKey.isDecrypted()) {
                    throw new Error(c('Error').t`Key is already decrypted`);
                }

                const { privateKey, encryptedPrivateKeyArmored } = await reactivateByUpload({
                    ID,
                    newPassword: password,
                    PrivateKey,
                    uploadedPrivateKey,
                    keyList: updatedAddressKeys,
                    email: Address?.Email,
                });
                updatedAddressKeys = await reactivatePrivateKey({
                    api,
                    ID,
                    keyList: updatedAddressKeys,
                    encryptedPrivateKeyArmored,
                    privateKey,
                    signingKey,
                    Address,
                });
            } else {
                const { privateKey: reformattedPrivateKey, privateKeyArmored } = await reformatAddressKey({
                    email: Address.Email,
                    passphrase: password,
                    privateKey: uploadedPrivateKey,
                });

                updatedAddressKeys = await createKeyHelper({
                    api,
                    privateKeyArmored,
                    fingerprint: reformattedPrivateKey.getFingerprint(),
                    Address,
                    keys: updatedAddressKeys,
                    signingKey,
                });
            }

            setKeysToImport((oldKeys) => updateKey(oldKeys, key, { status: Status.SUCCESS }));
        } catch (e) {
            setKeysToImport((oldKeys) => updateKey(oldKeys, key, { status: Status.ERROR, result: e }));
        }
    }
};
