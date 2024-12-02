import { CryptoProxy } from '@proton/crypto';
import { getDefaultKeyFlags } from '@proton/shared/lib/keys';

import { createAddressKeyRoute } from '../../api/keys';
import type { Address, Api, DecryptedKey, KeyTransparencyVerify } from '../../interfaces';
import {
    getActiveAddressKeys,
    getActiveKeyObject,
    getNormalizedActiveAddressKeys,
    getPrimaryFlag,
} from '../getActiveKeys';
import { getInactiveKeys } from '../getInactiveKeys';
import reactivateKeysProcessLegacy from '../reactivation/reactivateKeysProcessLegacy';
import { getSignedKeyListWithDeferredPublish } from '../signedKeyList';
import { getFilteredImportRecords } from './helper';
import type { KeyImportData, OnKeyImportCallback } from './interface';

export interface ImportKeysProcessLegacyArguments {
    api: Api;
    keyImportRecords: KeyImportData[];
    onImport: OnKeyImportCallback;
    keyPassword: string;
    address: Address;
    addressKeys: DecryptedKey[];
    keyTransparencyVerify: KeyTransparencyVerify;
}

// handles import with non-migrated keys
const importKeysProcessLegacy = async ({
    api,
    keyImportRecords,
    keyPassword,
    onImport,
    address,
    addressKeys,
    keyTransparencyVerify,
}: ImportKeysProcessLegacyArguments) => {
    const activeKeys = await getActiveAddressKeys(address, address.SignedKeyList, address.Keys, addressKeys);
    const inactiveKeys = await getInactiveKeys(address.Keys, activeKeys.v4); // v6 keys not present for non-migrated users

    const [keysToReactivate, keysToImport, existingKeys] = getFilteredImportRecords(
        keyImportRecords,
        activeKeys.v4,
        inactiveKeys
    );

    existingKeys.forEach((keyImportRecord) => {
        onImport(keyImportRecord.id, new Error('Key already active'));
    });

    let mutableActiveKeys = activeKeys;

    for (const keyImportRecord of keysToImport) {
        try {
            const { privateKey } = keyImportRecord;
            if (!privateKey.isPrivateKeyV4()) {
                throw new Error('v6 keys not supported with non-migrated keys');
            }
            const privateKeyArmored = await CryptoProxy.exportPrivateKey({
                privateKey,
                passphrase: keyPassword,
            });

            const newActiveKey = await getActiveKeyObject(privateKey, {
                ID: 'tmp',
                primary: getPrimaryFlag(mutableActiveKeys.v4),
                flags: getDefaultKeyFlags(address),
            });
            const updatedActiveKeys = getNormalizedActiveAddressKeys(address, {
                v4: [...mutableActiveKeys.v4, newActiveKey],
                v6: [],
            });
            const [SignedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
                updatedActiveKeys,
                address,
                keyTransparencyVerify
            );

            const { Key } = await api(
                createAddressKeyRoute({
                    AddressID: address.ID,
                    Primary: newActiveKey.primary,
                    PrivateKey: privateKeyArmored,
                    SignedKeyList,
                })
            );
            // Only once the SKL is successfully posted we add it to the KT commit state.
            await onSKLPublishSuccess();
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
        userKeys: [],
        addressesKeys: [
            {
                address,
                keys: mutableActiveKeys.v4,
            },
        ],
        keyReactivationRecords: [
            {
                address,
                keysToReactivate,
            },
        ],
        onReactivation: onImport,
        keyTransparencyVerify,
    });
};

export default importKeysProcessLegacy;
