import { EncryptionTag, ShareType } from '@proton/pass/types';
import type { OpenedShare, ShareGetResponse, VaultKey } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { decryptData } from '../../utils';

type OpenShareProcessParams = { encryptedShare: ShareGetResponse } & (
    | { type: ShareType.Vault; vaultKey: VaultKey }
    | { type: ShareType.Item }
);

export const openShare = async ({ encryptedShare, ...options }: OpenShareProcessParams): Promise<OpenedShare> => {
    const base = {
        addressId: encryptedShare.AddressID,
        targetType: encryptedShare.TargetType,
        targetId: encryptedShare.TargetID,
        shareId: encryptedShare.ShareID,
        vaultId: encryptedShare.VaultID,
        permission: encryptedShare.Permission,
        createTime: encryptedShare.CreateTime,
        expireTime: encryptedShare.ExpireTime,
    };

    switch (options.type) {
        case ShareType.Vault: {
            const content = await decryptData(
                options.vaultKey.key,
                base64StringToUint8Array(encryptedShare.Content!),
                EncryptionTag.VaultContent
            );

            return {
                ...base,
                contentKeyRotation: encryptedShare.ContentKeyRotation!,
                contentFormatVersion: encryptedShare.ContentFormatVersion!,
                content,
            };
        }
        case ShareType.Item: {
            return {
                ...base,
                content: null,
                contentFormatVersion: null,
                contentKeyRotation: null,
            };
        }
    }
};
