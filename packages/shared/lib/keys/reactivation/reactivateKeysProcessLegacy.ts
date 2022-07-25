import { CryptoProxy } from '@proton/crypto';
import { getDefaultKeyFlags } from '@proton/shared/lib/keys';

import { reactivateKeyRoute } from '../../api/keys';
import { Address, Api, DecryptedKey, Key } from '../../interfaces';
import { getActiveKeyObject, getActiveKeys, getPrimaryFlag, getNormalizedActiveKeys } from '../getActiveKeys';
import { getSignedKeyList } from '../signedKeyList';
import { KeyReactivationData, KeyReactivationRecord, OnKeyReactivationCallback } from './interface';
import { resetUserId } from './reactivateKeyHelper';

interface ReactivateKeysProcessArguments {
    api: Api;
    keyPassword: string;
    keysToReactivate: KeyReactivationData[];
    address?: Address;
    onReactivation: OnKeyReactivationCallback;
    keys: DecryptedKey[];
    Keys: Key[];
}

export const reactivateKeysProcess = async ({
    api,
    keyPassword,
    keysToReactivate,
    address,
    onReactivation,
    keys,
    Keys,
}: ReactivateKeysProcessArguments) => {
    const activeKeys = await getActiveKeys(address, address?.SignedKeyList, Keys, keys);

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
            const newActiveKey = await getActiveKeyObject(reactivatedKey, {
                ID,
                primary: getPrimaryFlag(mutableActiveKeys),
                flags: getDefaultKeyFlags(address),
            });
            const updatedActiveKeys = getNormalizedActiveKeys(address, [...mutableActiveKeys, newActiveKey]);
            const SignedKeyList = address ? await getSignedKeyList(updatedActiveKeys) : undefined;

            await api(
                reactivateKeyRoute({
                    ID,
                    PrivateKey: privateKeyArmored,
                    SignedKeyList,
                })
            );

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
    keyPassword: string;
}

const reactivateKeysProcessLegacy = async ({
    keyReactivationRecords,
    api,
    onReactivation,
    keyPassword,
}: ReactivateKeysProcessLegacyArguments) => {
    for (const keyReactivationRecord of keyReactivationRecords) {
        const { user, address, keysToReactivate, keys } = keyReactivationRecord;
        try {
            const Keys = address ? address.Keys : user?.Keys || [];
            await reactivateKeysProcess({
                api,
                keyPassword,
                keysToReactivate,
                address,
                onReactivation,
                keys,
                Keys,
            });
        } catch (e: any) {
            keysToReactivate.forEach(({ id }) => onReactivation(id, e));
        }
    }
};

export default reactivateKeysProcessLegacy;
