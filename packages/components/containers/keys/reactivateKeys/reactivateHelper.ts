import { c } from 'ttag';
import { decryptPrivateKey, OpenPGPKey } from 'pmcrypto';
import {
    reformatAddressKey,
    decryptPrivateKeyWithSalt,
    getEncryptedArmoredAddressKey,
    getOldUserIDEmail,
} from 'proton-shared/lib/keys/keys';
import { KeySalt, ActionableKey, Api, Address, CachedKey } from 'proton-shared/lib/interfaces';
import { reactivateKeyAction } from 'proton-shared/lib/keys/keysAction';
import { getDefaultKeyFlags } from 'proton-shared/lib/keys/keyFlags';
import { reactivateKeyRoute } from 'proton-shared/lib/api/keys';
import getSignedKeyList from 'proton-shared/lib/keys/getSignedKeyList';
import { noop } from 'proton-shared/lib/helpers/function';

interface ReactivatePrivateKeyArguments {
    api: Api;
    ID: string;
    parsedKeys: CachedKey[];
    actionableKeys: ActionableKey[];
    signingKey: OpenPGPKey;
    privateKey: OpenPGPKey;
    encryptedPrivateKeyArmored: string;
    Address?: Address;
}
export const reactivatePrivateKey = async ({
    api,
    ID,
    parsedKeys,
    actionableKeys,
    privateKey,
    signingKey,
    encryptedPrivateKeyArmored,
    Address,
}: ReactivatePrivateKeyArguments) => {
    const result = reactivateKeyAction({
        ID,
        parsedKeys,
        actionableKeys,
        privateKey,
        flags: getDefaultKeyFlags(),
    });

    await api(
        reactivateKeyRoute({
            ID,
            PrivateKey: encryptedPrivateKeyArmored,
            SignedKeyList: Address ? await getSignedKeyList(result, signingKey) : undefined,
        })
    );

    return result;
};

interface ReactivateByUploadArguments {
    ID: string;
    PrivateKey: string;
    uploadedPrivateKey: OpenPGPKey;
    parsedKeys: CachedKey[];
    newPassword: string;
    email?: string;
}
export const reactivateByUpload = async ({
    ID,
    newPassword,
    PrivateKey,
    uploadedPrivateKey,
    parsedKeys,
    email,
}: ReactivateByUploadArguments) => {
    const uploadedFingerprint = uploadedPrivateKey.getFingerprint();
    const oldKeyContainer = parsedKeys.find(({ privateKey }) => privateKey?.getFingerprint() === uploadedFingerprint);

    if (!oldKeyContainer) {
        throw new Error(c('Error').t`Key does not exist`);
    }
    if (oldKeyContainer.Key.ID !== ID) {
        throw new Error(c('Error').t`Key ID mismatch`);
    }

    const emailToUse = email || (await getOldUserIDEmail(PrivateKey).catch(noop)) || '';

    const { privateKey: reformattedPrivateKey, privateKeyArmored } = await reformatAddressKey({
        email: emailToUse,
        passphrase: newPassword,
        privateKey: uploadedPrivateKey,
    });

    return {
        privateKey: reformattedPrivateKey,
        encryptedPrivateKeyArmored: privateKeyArmored,
    };
};

interface ReactivateByPasswordArguments {
    ID: string;
    keySalts: KeySalt[];
    PrivateKey: string;
    oldPassword: string;
    newPassword: string;
    email?: string;
}
export const reactivateByPassword = async ({
    ID,
    keySalts,
    PrivateKey,
    oldPassword,
    newPassword,
    email,
}: ReactivateByPasswordArguments) => {
    const { KeySalt } = keySalts.find(({ ID: keySaltID }) => ID === keySaltID) || {};

    const oldPrivateKey = await decryptPrivateKeyWithSalt({
        PrivateKey,
        keySalt: KeySalt,
        password: oldPassword,
    }).catch(noop);

    if (!oldPrivateKey) {
        throw new Error(c('Error').t`Incorrect password`);
    }

    const emailToUse = email || (await getOldUserIDEmail(PrivateKey).catch(noop)) || '';

    const encryptedPrivateKeyArmored = await getEncryptedArmoredAddressKey(oldPrivateKey, emailToUse, newPassword);
    if (!encryptedPrivateKeyArmored) {
        throw new Error(c('Error').t`Key not decrypted`);
    }
    const privateKey = await decryptPrivateKey(encryptedPrivateKeyArmored, newPassword);

    return {
        privateKey,
        encryptedPrivateKeyArmored,
    };
};
