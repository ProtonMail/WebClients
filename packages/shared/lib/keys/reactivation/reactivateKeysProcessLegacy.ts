import type { PrivateKeyReferenceV4, PrivateKeyReferenceV6 } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { getDefaultKeyFlags } from '@proton/shared/lib/keys';

import { reactivateKeyRoute } from '../../api/keys';
import {
    type ActiveKeyWithVersion,
    type Address,
    type Api,
    type DecryptedKey,
    type Key,
    type KeyTransparencyVerify,
    isActiveKeyV6,
} from '../../interfaces';
import {
    getActiveAddressKeys,
    getActiveKeyObject,
    getNormalizedActiveAddressKeys,
    getPrimaryFlag,
} from '../getActiveKeys';
import { getSignedKeyListWithDeferredPublish } from '../signedKeyList';
import type { KeyReactivationData, KeyReactivationRecord, OnKeyReactivationCallback } from './interface';
import { resetUserId } from './reactivateKeyHelper';

interface ReactivateKeysProcessArguments {
    api: Api;
    keyPassword: string;
    keysToReactivate: KeyReactivationData[];
    address?: Address;
    onReactivation: OnKeyReactivationCallback;
    keys: DecryptedKey[];
    Keys: Key[];
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const reactivateKeysProcess = async ({
    api,
    keyPassword,
    keysToReactivate,
    address,
    onReactivation,
    keys,
    Keys,
    keyTransparencyVerify,
}: ReactivateKeysProcessArguments) => {
    const activeKeys = await getActiveAddressKeys(address, address?.SignedKeyList, Keys, keys);

    let mutableActiveKeys = activeKeys;

    for (const keyToReactivate of keysToReactivate) {
        const { id, Key, privateKey: reactivatedKey } = keyToReactivate;
        const { ID } = Key;
        try {
            if (!reactivatedKey) {
                throw new Error('Missing key');
            }

            await resetUserId(Key, reactivatedKey);

            const privateKeyArmored = await CryptoProxy.exportPrivateKey({
                privateKey: reactivatedKey,
                passphrase: keyPassword,
            });
            const newActiveKey = (await getActiveKeyObject(
                reactivatedKey as PrivateKeyReferenceV4 | PrivateKeyReferenceV6,
                {
                    ID,
                    // We do not mark the v6 as primary by default, because it will fail if forwarding is enabled
                    primary: reactivatedKey.isPrivateKeyV6() ? 0 : getPrimaryFlag(mutableActiveKeys.v4),
                    flags: getDefaultKeyFlags(address),
                }
            )) as ActiveKeyWithVersion;
            const toNormalize = isActiveKeyV6(newActiveKey)
                ? { v4: [...mutableActiveKeys.v4], v6: [...mutableActiveKeys.v6, newActiveKey] }
                : { v4: [...mutableActiveKeys.v4, newActiveKey], v6: [...mutableActiveKeys.v6] };
            const updatedActiveKeys = getNormalizedActiveAddressKeys(address, toNormalize);
            const [SignedKeyList, onSKLPublishSuccess] = address
                ? await getSignedKeyListWithDeferredPublish(updatedActiveKeys, address, keyTransparencyVerify)
                : [undefined, undefined];
            await api(
                reactivateKeyRoute({
                    ID,
                    PrivateKey: privateKeyArmored,
                    SignedKeyList,
                })
            );
            if (onSKLPublishSuccess) {
                await onSKLPublishSuccess();
            }

            mutableActiveKeys = updatedActiveKeys;

            onReactivation(id, 'ok');
        } catch (e: any) {
            onReactivation(id, e);
        }
    }
};

export interface ReactivateKeysProcessLegacyArguments {
    api: Api;
    keyReactivationRecords: KeyReactivationRecord[];
    onReactivation: OnKeyReactivationCallback;
    addressesKeys: { address: Address; keys: DecryptedKey[] }[];
    userKeys: DecryptedKey[];
    keyPassword: string;
    keyTransparencyVerify: KeyTransparencyVerify;
}

const reactivateKeysProcessLegacy = async ({
    keyReactivationRecords,
    addressesKeys,
    userKeys,
    api,
    onReactivation,
    keyPassword,
    keyTransparencyVerify,
}: ReactivateKeysProcessLegacyArguments) => {
    for (const keyReactivationRecord of keyReactivationRecords) {
        const { user, address, keysToReactivate } = keyReactivationRecord;
        try {
            const Keys = address ? address.Keys : user?.Keys || [];
            const keys = address
                ? addressesKeys.find((addressKeys) => addressKeys.address.ID === address.ID)?.keys
                : userKeys;
            if (!keys) {
                throw new Error('Missing keys');
            }
            await reactivateKeysProcess({
                api,
                keyPassword,
                keysToReactivate,
                address,
                onReactivation,
                keys,
                Keys,
                keyTransparencyVerify,
            });
        } catch (e: any) {
            keysToReactivate.forEach(({ id }) => onReactivation(id, e));
        }
    }
};

export default reactivateKeysProcessLegacy;
