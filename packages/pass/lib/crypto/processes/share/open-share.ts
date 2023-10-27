import { decryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import type { OpenedShare, ShareGetResponse, ShareRole, VaultKey } from '@proton/pass/types';
import { PassEncryptionTag, ShareType } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

type OpenShareProcessParams = { encryptedShare: ShareGetResponse } & (
    | { type: ShareType.Vault; vaultKey: VaultKey }
    | { type: ShareType.Item }
);

export const openShare = async ({ encryptedShare, ...options }: OpenShareProcessParams): Promise<OpenedShare> => {
    const base = {
        addressId: encryptedShare.AddressID,
        createTime: encryptedShare.CreateTime,
        expireTime: encryptedShare.ExpireTime,
        newUserInvitesReady: encryptedShare.NewUserInvitesReady,
        owner: encryptedShare.Owner,
        permission: encryptedShare.Permission,
        shared: encryptedShare.Shared,
        shareId: encryptedShare.ShareID,
        shareRoleId: encryptedShare.ShareRoleID! as ShareRole, // fixme : check optionality
        targetId: encryptedShare.TargetID,
        targetMaxMembers: encryptedShare.TargetMaxMembers,
        targetMembers: encryptedShare.TargetMembers,
        targetType: encryptedShare.TargetType,
        vaultId: encryptedShare.VaultID,
    };

    switch (options.type) {
        case ShareType.Vault: {
            const content = await decryptData(
                options.vaultKey.key,
                base64StringToUint8Array(encryptedShare.Content!),
                PassEncryptionTag.VaultContent
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
