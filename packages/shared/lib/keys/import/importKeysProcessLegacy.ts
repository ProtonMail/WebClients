import { CryptoProxy } from '@proton/crypto';
import { getDefaultKeyFlags } from '@proton/shared/lib/keys';

import { createAddressKeyRoute } from '../../api/keys';
import { Address, Api, DecryptedKey } from '../../interfaces';
import { getActiveKeyObject, getActiveKeys, getPrimaryFlag, getNormalizedActiveKeys } from '../getActiveKeys';
import { getInactiveKeys } from '../getInactiveKeys';
import reactivateKeysProcessLegacy from '../reactivation/reactivateKeysProcessLegacy';
import { getSignedKeyList } from '../signedKeyList';
import { getFilteredImportRecords } from './helper';
import { KeyImportData, OnKeyImportCallback } from './interface';

export interface ImportKeysProcessLegacyArguments {
    api: Api;
    keyImportRecords: KeyImportData[];
    onImport: OnKeyImportCallback;
    keyPassword: string;
    address: Address;
    addressKeys: DecryptedKey[];
}

const importKeysProcessLegacy = async ({
    api,
    keyImportRecords,
    keyPassword,
    onImport,
    address,
    addressKeys,
}: ImportKeysProcessLegacyArguments) => {
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
            const privateKeyArmored = await CryptoProxy.exportPrivateKey({
                privateKey,
                passphrase: keyPassword,
            });

            const newActiveKey = await getActiveKeyObject(privateKey, {
                ID: 'tmp',
                primary: getPrimaryFlag(mutableActiveKeys),
                flags: getDefaultKeyFlags(address),
            });
            const updatedActiveKeys = getNormalizedActiveKeys(address, [...mutableActiveKeys, newActiveKey]);
            const SignedKeyList = await getSignedKeyList(updatedActiveKeys);

            const { Key } = await api(
                createAddressKeyRoute({
                    AddressID: address.ID,
                    Primary: newActiveKey.primary,
                    PrivateKey: privateKeyArmored,
                    SignedKeyList,
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

    await reactivateKeysProcessLegacy({
        api,
        keyPassword,
        keyReactivationRecords: [
            {
                address,
                keys: mutableActiveKeys,
                keysToReactivate,
            },
        ],
        onReactivation: onImport,
    });
};

export default importKeysProcessLegacy;
