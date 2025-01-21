import { importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import type { ShareId, ShareManager } from '@proton/pass/types';
import {
    type OpenedShare,
    type Rotation,
    type SerializedCryptoContext,
    type ShareKey,
    ShareType,
} from '@proton/pass/types';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

export const hydrateShareKeys = async (
    serializedKeys: SerializedCryptoContext<Map<Rotation, ShareKey>>
): Promise<Map<Rotation, ShareKey>> => {
    const keys: [Rotation, ShareKey][] = await Promise.all(
        serializedKeys.map(async ([rotation, { raw, userKeyId }]) => {
            const rawKey = base64StringToUint8Array(raw);
            const key = await importSymmetricKey(rawKey);
            return [rotation, { rotation, raw: rawKey, key, userKeyId }];
        })
    );

    return new Map(keys);
};

/** Item shares do not have a content property. Only encode
 * the vault content when dealing with vault shares */
export const hydrateShare = (serializedShare: SerializedCryptoContext<OpenedShare>): OpenedShare => {
    switch (serializedShare.targetType) {
        case ShareType.Vault:
            return { ...serializedShare, content: base64StringToUint8Array(serializedShare.content) };
        case ShareType.Item:
            return serializedShare;
    }
};

export const serializeShareKeys = (keys: Map<Rotation, ShareKey>): SerializedCryptoContext<Map<Rotation, ShareKey>> =>
    [...keys.entries()].map(([rotation, vaultKey]) => [
        rotation,
        {
            rotation: vaultKey.rotation,
            raw: uint8ArrayToBase64String(vaultKey.raw),
            userKeyId: vaultKey.userKeyId,
        },
    ]);

export const serializeShare = (share: OpenedShare): SerializedCryptoContext<OpenedShare> => {
    switch (share.targetType) {
        case ShareType.Vault:
            return { ...share, content: uint8ArrayToBase64String(share.content) };
        case ShareType.Item:
            return share;
    }
};

export const serializeShareManagers = (
    managers: Map<ShareId, ShareManager>
): SerializedCryptoContext<Map<ShareId, ShareManager>> =>
    [...managers.entries()].map(([shareId, manager]) => [shareId, manager.serialize()]);
