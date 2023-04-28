import { c } from 'ttag';

import { api } from '@proton/pass/api';
import { PassCrypto } from '@proton/pass/crypto';
import type { Share, ShareContent, ShareKeyResponse, ShareType, VaultCreateRequest } from '@proton/pass/types';
import { decodeVaultContent, encodeVaultContent } from '@proton/pass/utils/protobuf';

import { getShareLatestEventId } from './shares';

/* ⚠️ This endpoint is not paginated yet back-end side. */
export const getAllShareKeys = async (shareId: string): Promise<ShareKeyResponse[]> => {
    const response = await api({
        url: `pass/v1/share/${shareId}/key`,
        params: { Page: 0 },
        method: 'get',
    });

    return response.ShareKeys?.Keys ?? [];
};

export const createVault = async (data: {
    content: ShareContent<ShareType.Vault>;
    primary?: boolean;
}): Promise<Share<ShareType.Vault>> => {
    const encoded = encodeVaultContent(data.content);

    const encryptedVault: VaultCreateRequest = {
        ...(await PassCrypto.createVault(encoded)),
        Primary: data.primary ?? false,
    };

    const encryptedShare = (
        await api({
            url: 'pass/v1/vault',
            method: 'post',
            data: encryptedVault,
        })
    ).Share!;

    const [eventId, shareKeys] = await Promise.all([
        getShareLatestEventId(encryptedShare.ShareID),
        getAllShareKeys(encryptedShare.ShareID),
    ]);

    const share = await PassCrypto.openShare<ShareType.Vault>({ encryptedShare, shareKeys });
    if (!share) throw new Error(c('Error').t`Could not open created vault`);

    const content = decodeVaultContent(share.content);

    return {
        shareId: share.shareId,
        targetId: share.targetId,
        targetType: share.targetType,
        vaultId: share.vaultId,
        content,
        primary: Boolean(encryptedShare.Primary),
        eventId,
    };
};

export const editVault = async (
    shareId: string,
    content: ShareContent<ShareType.Vault>
): Promise<Share<ShareType.Vault>> => {
    /**
     * Future-proofing : retrieve all share keys
     * and update the share in the crypto context
     */
    const [eventId, shareKeys] = await Promise.all([getShareLatestEventId(shareId), getAllShareKeys(shareId)]);
    await PassCrypto.updateShareKeys({ shareId, shareKeys });

    const encoded = encodeVaultContent(content);
    const encryptedVaultUpdate = await PassCrypto.updateVault({ shareId, content: encoded });

    const encryptedShare = (
        await api({
            url: `pass/v1/vault/${shareId}`,
            method: 'put',
            data: encryptedVaultUpdate,
        })
    ).Share!;

    const share = await PassCrypto.openShare<ShareType.Vault>({ encryptedShare, shareKeys });
    if (!share) throw new Error(c('Error').t`Could not open updated vault`);

    return {
        shareId: share.shareId,
        targetId: share.targetId,
        targetType: share.targetType,
        vaultId: share.vaultId,
        content: decodeVaultContent(share.content),
        primary: Boolean(encryptedShare.Primary),
        eventId,
    };
};
