import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import { getDefaultKeyFlags } from '@proton/shared/lib/keys';

import { createAddressKeyRouteV2 } from '../../api/keys';
import { Address, Api, DecryptedKey } from '../../interfaces';
import { generateAddressKeyTokens } from '../addressKeys';
import { getActiveKeyObject, getActiveKeys, getPrimaryFlag, getNormalizedActiveKeys } from '../getActiveKeys';
import { getInactiveKeys } from '../getInactiveKeys';
import { reactivateAddressKeysV2 } from '../reactivation/reactivateKeysProcessV2';
import { getSignedKeyList } from '../signedKeyList';
import { getFilteredImportRecords } from './helper';
import { KeyImportData, OnKeyImportCallback } from './interface';

export interface ImportKeysProcessV2Arguments {
    api: Api;
    keyImportRecords: KeyImportData[];
    onImport: OnKeyImportCallback;
    keyPassword: string;
    address: Address;
    addressKeys: DecryptedKey[];
    userKey: PrivateKeyReference;
}

const importKeysProcessV2 = async ({
    api,
    keyImportRecords,
    onImport,
    address,
    addressKeys,
    userKey,
}: ImportKeysProcessV2Arguments) => {
    const activeKeys = await getActiveKeys(address, address.SignedKeyList, address.Keys, addressKeys);
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
            const privateKeyArmored = await CryptoProxy.exportPrivateKey({
                privateKey,
                passphrase: token,
            });

            const newActiveKey = await getActiveKeyObject(privateKey, {
                ID: 'tmp',
                primary: getPrimaryFlag(mutableActiveKeys),
                flags: getDefaultKeyFlags(address),
            });
            const updatedActiveKeys = getNormalizedActiveKeys(address, [...mutableActiveKeys, newActiveKey]);
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
        } catch (e: any) {
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
