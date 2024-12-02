import type { PrivateKeyReference, PrivateKeyReferenceV4, PrivateKeyReferenceV6 } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { getDefaultKeyFlags } from '@proton/shared/lib/keys';

import { createAddressKeyRouteV2 } from '../../api/keys';
import { ActiveKeyWithVersion, isActiveKeyV6, type Address, type Api, type DecryptedKey, type KeyTransparencyVerify } from '../../interfaces';
import { generateAddressKeyTokens } from '../addressKeys';
import { getActiveKeyObject, getActiveKeys, getNormalizedActiveKeys, getPrimaryFlag } from '../getActiveKeys';
import { getInactiveKeys } from '../getInactiveKeys';
import { reactivateAddressKeysV2 } from '../reactivation/reactivateKeysProcessV2';
import { getSignedKeyListWithDeferredPublish } from '../signedKeyList';
import { getFilteredImportRecords } from './helper';
import type { KeyImportData, OnKeyImportCallback } from './interface';

export interface ImportKeysProcessV2Arguments {
    api: Api;
    keyImportRecords: KeyImportData[];
    onImport: OnKeyImportCallback;
    keyPassword: string;
    address: Address;
    addressKeys: DecryptedKey[];
    userKey: PrivateKeyReference;
    keyTransparencyVerify: KeyTransparencyVerify;
}

const importKeysProcessV2 = async ({
    api,
    keyImportRecords,
    onImport,
    address,
    addressKeys,
    userKey,
    keyTransparencyVerify,
}: ImportKeysProcessV2Arguments) => {
    const activeKeys = await getActiveKeys(address, address.SignedKeyList, address.Keys, addressKeys);
    const activeKeysList = [...activeKeys.v4, ...activeKeys.v6];
    const inactiveKeys = await getInactiveKeys(address.Keys, activeKeysList);

    const [keysToReactivate, keysToImport, existingKeys] = getFilteredImportRecords(
        keyImportRecords,
        activeKeysList,
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

            const newActiveKey = await getActiveKeyObject(privateKey as (PrivateKeyReferenceV4 | PrivateKeyReferenceV6), {
                ID: 'tmp',
                // Do not set v6 as primary automatically (doing so would fail if forwarding is setup)
                primary: privateKey.isPrivateKeyV6() ? 0 : getPrimaryFlag(mutableActiveKeys.v4),
                flags: getDefaultKeyFlags(address),
            }) as ActiveKeyWithVersion;
            const toNormalize = isActiveKeyV6(newActiveKey) ?
                { v4: [...mutableActiveKeys.v4], v6: [...mutableActiveKeys.v6, newActiveKey] } :
                { v4: [...mutableActiveKeys.v4, newActiveKey], v6: [...mutableActiveKeys.v6] }
            const updatedActiveKeys = getNormalizedActiveKeys(address, toNormalize);
            const [SignedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
                updatedActiveKeys,
                address,
                keyTransparencyVerify
            );

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

    await reactivateAddressKeysV2({
        api,
        address,
        activeKeys: mutableActiveKeys,
        userKey,
        keysToReactivate,
        onReactivation: onImport,
        keyTransparencyVerify,
    });
};

export default importKeysProcessV2;
