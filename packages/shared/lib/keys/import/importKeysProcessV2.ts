import { OpenPGPKey } from 'pmcrypto';

import { Address, Api, DecryptedKey } from '../../interfaces';
import { KeyImportData, OnKeyImportCallback } from './interface';
import { getActiveKeyObject, getActiveKeys, getPrimaryFlag } from '../getActiveKeys';
import { getInactiveKeys } from '../getInactiveKeys';
import { getFilteredImportRecords } from './helper';
import { generateAddressKeyTokens, reformatAddressKey } from '../addressKeys';
import { getSignedKeyList } from '../signedKeyList';
import { createAddressKeyRouteV2 } from '../../api/keys';
import { reactivateAddressKeysV2 } from '../reactivation/reactivateKeysProcessV2';

export interface ImportKeysProcessV2Arguments {
    api: Api;
    keyImportRecords: KeyImportData[];
    onImport: OnKeyImportCallback;
    keyPassword: string;
    address: Address;
    addressKeys: DecryptedKey[];
    userKey: OpenPGPKey;
}

const importKeysProcessV2 = async ({
    api,
    keyImportRecords,
    onImport,
    address,
    addressKeys,
    userKey,
}: ImportKeysProcessV2Arguments) => {
    const activeKeys = await getActiveKeys(address.SignedKeyList, address.Keys, addressKeys);
    const inactiveKeys = await getInactiveKeys(address.Keys, activeKeys);

    const [keysToReactivate, keysToImport, existingKeys] = getFilteredImportRecords(
        keyImportRecords,
        activeKeys,
        inactiveKeys
    );

    existingKeys.forEach((keyImportRecord) => {
        onImport(keyImportRecord.id, new Error('Key already active'));
    });

    let mutableActiveKeys = activeKeys;

    for (const keyImportRecord of keysToImport) {
        try {
            const { privateKey } = keyImportRecord;

            const { token, encryptedToken, signature } = await generateAddressKeyTokens(userKey);

            const { privateKey: reformattedPrivateKey, privateKeyArmored } = await reformatAddressKey({
                email: address.Email,
                passphrase: token,
                privateKey,
            });

            const newActiveKey = await getActiveKeyObject(reformattedPrivateKey, {
                ID: 'tmp',
                primary: getPrimaryFlag(mutableActiveKeys),
            });
            const updatedActiveKeys = [...mutableActiveKeys, newActiveKey];
            const SignedKeyList = await getSignedKeyList(updatedActiveKeys);

            const { Key } = await api(
                createAddressKeyRouteV2({
                    AddressID: address.ID,
                    Primary: newActiveKey.primary,
                    PrivateKey: privateKeyArmored,
                    SignedKeyList,
                    Signature: signature,
                    Token: encryptedToken,
                })
            );

            // Mutably update the key with the latest value from the real ID.
            newActiveKey.ID = Key.ID;

            mutableActiveKeys = updatedActiveKeys;

            onImport(keyImportRecord.id, 'ok');
        } catch (e) {
            onImport(keyImportRecord.id, e);
        }
    }

    await reactivateAddressKeysV2({
        api,
        address,
        activeKeys: mutableActiveKeys,
        userKey,
        keysToReactivate,
        onReactivation: onImport,
    });
};

export default importKeysProcessV2;
