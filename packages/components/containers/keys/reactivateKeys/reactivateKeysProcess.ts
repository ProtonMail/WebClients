import { c } from 'ttag';
import { getKeySalts } from 'proton-shared/lib/api/keys';
import getKeysActionList from 'proton-shared/lib/keys/getKeysActionList';
import getPrimaryKey from 'proton-shared/lib/keys/getPrimaryKey';
import { KeySalt, CachedKey, Api } from 'proton-shared/lib/interfaces';

import { ReactivateKeys, SetKeysToReactivate, Status } from './interface';
import { updateKey } from './state';
import { reactivateByPassword, reactivateByUpload, reactivatePrivateKey } from './reactivateHelper';

interface Arguments {
    api: Api;
    keysToReactivate: ReactivateKeys[];
    setKeysToReactivate: SetKeysToReactivate;
    oldPassword?: string;
    newPassword: string;
    isUploadMode: boolean;
    addressesKeysMap?: { [key: string]: CachedKey[] };
    userKeysList: CachedKey[];
}
export default async ({
    api,
    keysToReactivate,
    setKeysToReactivate,
    oldPassword,
    newPassword,
    addressesKeysMap,
    userKeysList,
    isUploadMode,
}: Arguments) => {
    const keySalts = await api<any>(getKeySalts()).then(({ KeySalts }: { KeySalts: KeySalt[] }) => KeySalts);

    for (const { Address, keys } of keysToReactivate) {
        if (Address && !addressesKeysMap) {
            throw new Error(c('Error').t`Addresses keys map required`);
        }
        const completeKeyList = Address && addressesKeysMap ? addressesKeysMap[Address.ID] : userKeysList;

        const { privateKey: primaryPrivateKey } = getPrimaryKey(completeKeyList) || {};
        if (!primaryPrivateKey) {
            throw new Error(c('Error').t`Primary private key not decrypted`);
        }
        let updatedKeyList = await getKeysActionList(completeKeyList);

        for (const inactiveKey of keys) {
            const { ID, uploadedPrivateKey } = inactiveKey;

            const {
                Key: { PrivateKey },
                privateKey: oldPrivateKey,
            } = completeKeyList.find(({ Key: { ID: otherID } }) => ID === otherID) || { Key: {} };
            if (!PrivateKey) {
                throw new Error(c('Error').t`Key not found`);
            }
            if (oldPrivateKey && oldPrivateKey.isDecrypted()) {
                throw new Error(c('Error').t`Key is already decrypted`);
            }

            try {
                if (uploadedPrivateKey && isUploadMode) {
                    const { privateKey, encryptedPrivateKeyArmored } = await reactivateByUpload({
                        ID,
                        newPassword,
                        PrivateKey,
                        uploadedPrivateKey,
                        keyList: updatedKeyList,
                        email: Address?.Email,
                    });
                    updatedKeyList = await reactivatePrivateKey({
                        api,
                        ID,
                        keyList: updatedKeyList,
                        encryptedPrivateKeyArmored,
                        privateKey,
                        signingKey: primaryPrivateKey,
                        Address,
                    });
                } else {
                    if (!oldPassword) {
                        throw new Error(c('Error').t`Missing password`);
                    }
                    const { privateKey, encryptedPrivateKeyArmored } = await reactivateByPassword({
                        ID,
                        keySalts,
                        PrivateKey,
                        oldPassword,
                        newPassword,
                    });
                    updatedKeyList = await reactivatePrivateKey({
                        api,
                        ID,
                        keyList: updatedKeyList,
                        encryptedPrivateKeyArmored,
                        privateKey,
                        signingKey: primaryPrivateKey,
                        Address,
                    });
                }

                setKeysToReactivate((oldKeys) =>
                    updateKey(oldKeys, inactiveKey, { status: Status.SUCCESS, result: 'ok' })
                );
            } catch (e) {
                setKeysToReactivate((oldKeys) => updateKey(oldKeys, inactiveKey, { status: Status.ERROR, result: e }));
            }
        }
    }
};
